import os
import subprocess as subp
from typing import Callable, Literal, Optional

from core.config import Config
from core.logger import Logger
from core.utils.typing_utils import aware
from makemkv.make_mkv_wrapper import MakeMKVWrapper
from makemkv.models.disc_properties import Disc, Stream, Title
from metadata.metadata_wrapper import MetadataWrapper
from metadata.models.metadata import MovieMetadata, TvMetadata
from process.process_manager import ProcessManager


class BlueRayRipper:
    """
    A class representing a BlueRayRipper object that can read disc properties, fetch metadata from
    TMDB, and detect the main feature of the disc to finally rip it.
    """

    def __init__(self, config: Config, logger: Logger, process_manager: ProcessManager):
        self._config = config
        self._logger = logger
        self._process_manager = process_manager

        self._device = self._config.get["input"]["device"]

        self._makemkv_client = MakeMKVWrapper(config, logger, process_manager)
        self._metadata_client = MetadataWrapper(config, logger)

        self._disc: Disc = {}
        self._titles: dict[int, Title] = {}

        self._movie_metadata: MovieMetadata | None = None
        self._tv_metadata: TvMetadata | None = None

        self._main_feature: int | None = None
        self._content_type: Literal["movie", "tv"] | None = None

    ################################################################################################
    # Actual ripping process                                                                       #
    ################################################################################################

    def rip_main_feature(
        self, output_dir: str, cb: Optional[Callable[[float], None]] = None
    ):
        if self._main_feature is None:
            raise ValueError("No main feature was detected.")

        if self._movie_metadata is None and self._tv_metadata is None:
            raise ValueError("No metadata was fetched.")

        metadata = aware(self._movie_metadata or self._tv_metadata)

        self._makemkv_client.rip_blue_ray(self._main_feature, cb)

        temp_path = os.path.join(
            self._config.get["output"]["working_dir"],
            aware(self._titles[self._main_feature].get("output_file_name")),
        )

        final_name = f"{metadata.get('title')} ({metadata.get('year')}).mkv"
        final_path = os.path.join(output_dir, final_name)

        os.renames(temp_path, final_path)

        if self._config.get["output"]["eject_disc"]:
            subp.call(["eject", self._device])

        return os.path.abspath(final_path)

    ################################################################################################
    # Metadata-Gathering (MakeMKV, Disc, TMDB)                                                     #
    ################################################################################################

    def read_disc_properties(self):
        """
        Reads the properties of the disc and returns a tuple containing the disc and
        title information.

        Args:
            tmdb_id: The TMDB ID of the movie or tv show associated with the disc.
            content_type: The type of content (movie or tv) associated with the disc.

        Returns:
            BluRayRipper: The current instance of the BluRayRipper object.
        """

        (disc, titles) = self._makemkv_client.read_disc_properties()

        self._disc = disc
        self._titles = titles

        self._main_feature = None

        self._filter_streams()

        return self

    def fetch_metadata(self, tmdb_id: int, content_type: Literal["movie", "tv"]):
        """
        Fetches movie or TV show metadata from TMDB using the local title and year.

        Args:
            tmdb_id: The TMDB ID of the movie or tv show associated with the disc.
        """

        self._content_type = content_type

        self._logger.info(f"Fetching metadata from TMDB for id {tmdb_id}...")

        if self._content_type == "movie":
            self._movie_metadata = self._metadata_client.get_movie_details(tmdb_id)
        elif self._content_type == "tv":
            self._tv_metadata = self._metadata_client.get_tv_details(tmdb_id)

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
        weights = [0.81, 0.52, 0.089, 0.071, 0.030]

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

        metrics: list[tuple[int, int, int, int, int, int]] = []

        actual_runtime = 0
        if self._movie_metadata is not None:
            actual_runtime = self._movie_metadata.get("runtime") * 60

        for title, title_info in self._titles.items():
            stream = aware(title_info.get("streams")).values()
            duration = self._duration_to_seconds(title_info.get("duration", "0:00:00"))
            duration_diff = -abs(actual_runtime - duration)
            chapters = int(title_info.get("chapter_count", 0))
            n_subtitle = len([s for s in stream if self._is_type(s, "subtitle")])
            s_audio = len([s for s in stream if self._is_type(s, "audio")])
            metrics.append(
                (duration, duration_diff, n_subtitle, s_audio, chapters, title)
            )

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
