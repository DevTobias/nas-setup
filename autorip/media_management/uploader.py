import os
import time
from typing import Callable, Optional

from core.config import Config
from core.logger import Logger
from core.utils.file_utils import copy_with_callback
from typing_extensions import Literal

from media_management.radarr_wrapper import RadarrWrapper


class Uploader:
    def __init__(self, config: Config, logger: Logger):
        self.config = config
        self.logger = logger
        self.radarr_wrapper = RadarrWrapper(config, logger)

    def upload_file(
        self,
        input_file: str,
        tmdb_id: int,
        media_type: Literal["movie", "tv"],
        callback: Optional[Callable[[float, float], None]] = None,
    ):
        output_dir = self.create_media(tmdb_id, media_type)
        output_file = os.path.join(output_dir, os.path.basename(input_file))

        self.logger.info(f"Moving file {input_file} to {output_file}")
        start_time = time.time()

        def progress_callback(_: int, curr: int, total: int):
            progress = curr / total
            estimated_time = ((time.time() - start_time) / progress) * (1 - progress)

            if callback:
                callback(progress, estimated_time)

        copy_with_callback(input_file, output_file, progress_callback)

        self.logger.info(f"Finished moving file {input_file} to {output_file}")

        self.logger.info(f"Scanning {output_file}")
        self.scan_media(tmdb_id, media_type)
        time.sleep(10)

        self.logger.info(f"Removing {input_file}")
        # os.remove(input_file)

        self.logger.info(f"Renaming {output_file}")
        self.rename_media(tmdb_id, media_type)

    def create_media(self, tmdb_id: int, media_type: Literal["movie", "tv"]):
        if media_type == "movie":
            return self.radarr_wrapper.create_movie(tmdb_id)

        raise NotImplementedError()

    def scan_media(self, tmdb_id: int, media_type: Literal["movie", "tv"]):
        if media_type == "movie":
            return self.radarr_wrapper.scan_movie(tmdb_id)

        raise NotImplementedError()

    def rename_media(self, tmdb_id: int, media_type: Literal["movie", "tv"]):
        if media_type == "movie":
            return self.radarr_wrapper.rename_movie(tmdb_id)

        raise NotImplementedError()
