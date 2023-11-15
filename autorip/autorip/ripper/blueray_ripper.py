import csv
import os
from datetime import datetime

import xmltodict

from autorip.config import Config
from autorip.logger import Logger
from autorip.process import ProcessManager
from autorip.utils import aware, normalize_disc_title

from .models.disc_properties import Disc, Stream, Title
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

    def __init__(self, config: Config, logger: Logger, process_manager: ProcessManager):
        self._config = config
        self._logger = logger
        self._process_manager = process_manager

        self._device = self._config.get["input"]["devices"][0]

        self._makemkv_client = MakeMKVWrapper(config, logger, process_manager)
        self._tmdb_client = TMDBWrapper(config, logger)

        self._disc: Disc = {}
        self._titles: dict[int, Title] = {}

        self._local_title: str | None = None
        self._local_year: str | None = None
        self._movie_metadata: MovieResponse | None = None
        self._tv_metadata: TvResponse | None = None

        self._main_feature: int | None = None

    @property
    def main_feature(self):
        """
        Returns the main feature of the Blu-ray disc.

        Raises:
            ValueError: If no main feature was detected.

        Returns:
            Tuple[int, str]: A tuple containing the main feature index and title.
        """

        if self._main_feature is None:
            raise ValueError("No main feature was detected.")

        return (self._main_feature, self._titles[self._main_feature])

    ################################################################################################
    # Metadata-Gathering (MakeMKV, Disc, TMDB)                                                     #
    ################################################################################################

    def read_disc_properties(self):
        """
        Reads the properties of the disc and returns a tuple containing the disc and
        title information.

        Returns:
            The current instance of the BluRayRipper object.
        """

        self._logger.info(f"Reading disc properties from {self._device}...")

        properties = self._makemkv_client.read_disc_properties()

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

        self._logger.info(f"Successfully read disc properties: {self._disc}")
        self._logger.info(f"Successfully read title properties: {self._titles}")

        # Read the title from the device and fetch metadata from TMDB
        self._filter_streams()
        self._read_title_from_device()
        self._fetch_tmdb_info()

        return self

    def _read_title_from_device(self):
        """
        Reads the title of the disc from the device and returns it. If the title cannot be read from
        the device, the method falls back to the default disc name.
        """

        self._logger.info("Reading title from device...")

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
            self._logger.error(
                "Disc is a Blue Ray, but bdmt_eng.xml could not be found."
            )

        except KeyError:
            self._logger.error("Could not parse title from bdmt_eng.xml file.")

        self._local_title = normalize_disc_title(title)

    def _fetch_tmdb_info(self):
        """
        Fetches movie or TV show metadata from TMDB using the local title and year.
        """

        self._logger.info(f"Fetching metadata from TMDB for {self._local_title}...")

        search_response = self._tmdb_client.search(
            aware(self._local_title), self._local_year
        )

        if not search_response:
            self._logger.error("Could not find movie or show in TMDB.")
            return

        (media_id, media_type) = search_response

        if media_type == "movie":
            self._movie_metadata = self._tmdb_client.get_movie_details(media_id)
        elif media_type == "tv":
            self._tv_metadata = self._tmdb_client.get_tv_details(media_id)

    def _filter_streams(self):
        """
        Filters out titles that don't have any audio streams and titles that don't have any stream
        where the audio stream has any of the provided lang codes.
        """

        self._logger.info("Filtering out unwanted streams...")

        # Filter out titles that don't have any audio streams
        self._titles = {
            title: title_info
            for title, title_info in self._titles.items()
            if any(
                stream.get("type") == "Audio"
                for stream in aware(title_info.get("streams")).values()
            )
        }

        # Filter out titles that don't have any stream where the audio stream
        # has any of the provided lang codes
        self._titles = {
            title: title_info
            for title, title_info in self._titles.items()
            if any(
                stream.get("lang_code") in self._config.get["output"]["languages"]
                for stream in aware(title_info.get("streams")).values()
                if stream.get("type") == "Audio"
            )
        }

    ################################################################################################
    # Main Feature Detection                                                                       #
    ################################################################################################

    def detect_main_feature(self):
        """
        Detects the main feature of the Blu-ray disc by analyzing various metrics such as
        duration, chapters, subtitle streams, and audio streams.

        Returns:
            The current instance of the BluRayRipper object.
        """

        self._logger.info("Detecting main feature...")

        metrics = self._create_title_metrics()

        # Metrics weights: duration, chapters, subtitle_streams, audio_streams
        weights = [0.81, 0.089, 0.071, 0.030]

        # Largest of each metric, so we can normalize
        max_of_field = list(
            max(list(float(x[i]) for x in metrics)) for i in range(len(weights))
        )

        # Prune out any titles shorter than 85% of longest title
        metrics = list(filter(lambda x: x[0] > 0.85 * max_of_field[0], metrics))

        self._logger.info(f"Successfully pruned title metrics: {metrics}")

        # Sort according to weighted sum of metrics
        metrics = sorted(
            metrics,
            key=lambda row: sum(
                row[i] * weights[i] / max_of_field[i] for i in range(len(metrics))
            ),
        )

        self._main_feature = metrics[0][-1]
        self._logger.info(f"Successfully detected main feature: {self._main_feature}")

        return self

    def _create_title_metrics(self):
        """
        Creates a list of metrics for each title in the Blu-ray disc.

        Returns:
        A list of tuples, where each tuple contains the following metrics for a title:
            - Duration (in seconds)
            - Number of chapters
            - Number of subtitles
            - Number of audio streams
            - Title number
        """

        if len(self._titles) == 0:
            raise ValueError("No titles were found on the disc.")

        metrics: list[tuple[int, int, int, int, int]] = []

        for title, title_info in self._titles.items():
            stream = aware(title_info.get("streams")).values()
            duration = self._duration_to_seconds(title_info.get("duration", "0:00:00"))
            chapters = int(title_info.get("chapter_count", 0))
            n_subtitle = len([s for s in stream if self._is_type(s, "subtitle")])
            s_audio = len([s for s in stream if self._is_type(s, "audio")])
            metrics.append((duration, n_subtitle, s_audio, chapters, title))

        self._logger.debug(f"Successfully created title metrics: {metrics}")

        return metrics

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
