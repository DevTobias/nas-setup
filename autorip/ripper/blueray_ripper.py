import csv
import os
from datetime import datetime

import xmltodict
from utils import aware, logger, normalize_disc_title

from .models.disc_properties import Disc, Stream, Title, TitleMetrics
from .models.makemkv_attributes import MAKEMKV_ATTRIBUTE_ENUMS
from .models.tmdb_responses import MovieResponse, TvResponse
from .wrapper.makemkv import MakeMKVWrapper
from .wrapper.tmdb import TMDBWrapper


class BlueRayRipper:
    """
    A class representing a BlueRayRipper object that can read disc properties, fetch metadata from
    TMDB, and detect the main feature of the disc to finally rip it.

    Args:
        - device (str): The device path of the Blue-ray disc.
        - langs (list[str]): A list of language codes to filter the streams by.
        - imdb_token (str): The TMDB API token.
    """

    def __init__(self, device: str, langs: list[str], imdb_token: str):
        self._device = device
        self._imdb_token: str = imdb_token
        self._langs = langs

        self._makemkv_client = MakeMKVWrapper(device, True)
        self._tmdb_client = TMDBWrapper(imdb_token)

        self._disc: Disc = {}
        self._titles: dict[int, Title] = {}

        self._local_title: str | None = None
        self._local_year: str | None = None
        self._movie_metadata: MovieResponse | None = None
        self._tv_metadata: TvResponse | None = None

    ################################################################################################
    # Metadata-Gathering (MakeMKV, Disc, TMDB)                                                     #
    ################################################################################################

    def read_disc_properties(self):
        """
        Reads the properties of the disc and returns a tuple containing the disc and
        title information.

        Returns:
            Tuple: A tuple containing the disc and title information.
        """

        properties = self._makemkv_client.read_disc_properties()

        if not properties:
            return None

        _, stdout, _ = properties
        parsed = list(csv.reader(stdout.split("\n")))

        def save_value(obj: Disc | Title | Stream, prop: int | str, value: int | str):
            if prop in MAKEMKV_ATTRIBUTE_ENUMS:
                obj[MAKEMKV_ATTRIBUTE_ENUMS[prop]] = value

        for line in parsed:
            if len(line) == 0:
                continue

            # First column contains data after the first colon, make it a proper column
            data = line[0].split(":", 1) + line[1:]

            # Convert every possible column to int values
            data = [int(x) if x.isdigit() else x for x in data]
            key = data[0]

            # Parse general disc info
            if key == "CINFO":
                save_value(self._disc, data[1], data[3])

            # Parse title info
            elif key == "TINFO":
                title = int(data[1])
                self._titles.setdefault(title, {})
                save_value(self._titles[title], data[2], data[4])

            # Parse stream info
            elif key == "SINFO":
                title, stream = int(data[1]), int(data[2])
                self._titles[title].setdefault("streams", {}).setdefault(stream, {})
                save_value(
                    aware(self._titles[title].get("streams"))[stream], data[3], data[5]
                )

        # Filter out titles that don't have any stream where the audio stream
        # has any of the provided lang codes
        self._titles = {
            title: title_info
            for title, title_info in self._titles.items()
            if any(
                stream.get("lang_code") in self._langs
                for stream in aware(title_info.get("streams")).values()
                if stream.get("type") == "Audio"
            )
        }

        # Read the title from the device and fetch metadata from TMDB
        self._read_title_from_device()
        self._fetch_tmdb_info()

        return (self._disc, self._titles)

    def _read_title_from_device(self):
        """
        Reads the title of the disc from the device and returns it. If the title cannot be read from
        the device, the method falls back to the default disc name.
        """

        title = self._disc.get("name", "unknown").replace("_", " ").title()
        meta_path = self._device + "/BDMV/META/DL/bdmt_eng.xml"

        try:
            with open(meta_path, "r", encoding="utf-8") as file:
                modified_timestamp = os.path.getmtime(meta_path)
                self._local_year = datetime.fromtimestamp(modified_timestamp).strftime(
                    "%Y"
                )

                doc = xmltodict.parse(file.read())
                read_title: str = doc["disclib"]["di:discinfo"]["di:title"]["di:name"]
                title = read_title if read_title else self._disc["name"]

        except OSError:
            logger.error("Disc is a Blue Ray, but bdmt_eng.xml could not be found.")

        except KeyError:
            logger.error("Could not parse title from bdmt_eng.xml file.")

        self._local_title = normalize_disc_title(title)

    def _fetch_tmdb_info(self):
        """
        Fetches movie or TV show metadata from TMDB using the local title and year.
        """

        search_response = self._tmdb_client.search(
            aware(self._local_title), self._local_year
        )

        if not search_response:
            logger.error("Could not find movie or show in TMDB.")
            return

        (media_id, media_type) = search_response

        if media_type == "movie":
            self._movie_metadata = self._tmdb_client.get_movie_details(media_id)
        elif media_type == "tv":
            self._tv_metadata = self._tmdb_client.get_tv_details(media_id)

    ################################################################################################
    # Main Feature Detection                                                                       #
    ################################################################################################

    def detect_main_feature(self):
        if len(self._titles) == 0:
            return None

        title_metrics: list[TitleMetrics] = []

        for title, title_info in self._titles.items():
            title_metrics.append(
                {
                    "title": title,
                    "duration": self._duration_to_seconds(
                        title_info.get("duration", "0:00:00")
                    ),
                    "size": title_info.get("disk_size_bytes", 0),
                    "chapters": title_info.get("chapter_count", 0),
                    "subtitle_streams": len(
                        [
                            stream
                            for stream in aware(title_info.get("streams")).values()
                            if self._is_type(stream, "subtitle")
                        ]
                    ),
                    "audio_streams": len(
                        [
                            stream
                            for stream in aware(title_info.get("streams")).values()
                            if self._is_type(stream, "audio")
                        ]
                    ),
                    "video_streams": len(
                        [
                            stream
                            for stream in aware(title_info.get("streams")).values()
                            if self._is_type(stream, "video")
                        ]
                    ),
                }
            )

        return title_metrics

    ################################################################################################
    # Various helper functions                                                                     #
    ################################################################################################

    @staticmethod
    def _is_type(stream: Stream, stream_type: str):
        """
        Check if the given stream is of the specified type.

        Args:
            - stream (Stream): The stream to check.
            - stream_type (str): The type of stream to check for.

        Returns:
            bool: True if the stream is of the specified type, False otherwise.
        """
        return "type" in stream and stream_type in stream["type"].lower()

    @staticmethod
    def _duration_to_seconds(duration: str):
        """
        Converts a duration string in the format 'HH:MM:SS' to the total number of seconds.

        Args:
            - duration (str): The duration string to convert.

        Returns:
            int: The total number of seconds in the duration.
        """
        hours, minutes, seconds = map(int, duration.split(":"))
        return hours * 3600 + int(minutes) * 60 + int(seconds)
