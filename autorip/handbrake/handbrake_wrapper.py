import os
from typing import Callable, Literal, Optional

from core.config import Config
from core.logger import Logger
from process.process_manager import ProcessManager


class HandbrakeWrapper:
    def __init__(self, config: Config, logger: Logger, process_manager: ProcessManager):
        self.config = config
        self.logger = logger
        self.process_manager = process_manager

    def get_preset(self, preset_type: str):
        for preset in self.config.get["output"]["presets"]:
            if preset["type"] == preset_type:
                return preset

        return None

    def encode_file(
        self,
        input_file: str,
        output_file: str,
        preset_type: Literal["movie", "tv"],
        cb: Optional[Callable[[str, float], None]] = None,
    ):
        self.logger.debug(f"Encoding file: {input_file}")

        preset = self.get_preset(preset_type)

        if preset is None:
            raise ValueError(f"Could not find preset for type: {preset_type}")

        def encode_callback(line: str):
            self.logger.debug(line)

            if cb and '"Progress":' in line:
                cb("progress", float(line.split(":")[1].split(",")[0].strip()))

            if cb and '"ETASeconds":' in line:
                cb("eta", float(line.split(":")[1].split(",")[0].strip()))

        output_dir = os.path.dirname(output_file)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        returncode, stdout, stderr = self.process_manager.call(
            [
                "HandBrakeCLI",
                "--json",
                "--input",
                input_file,
                "--output",
                output_file,
                "--preset-import-file",
                preset["path"],
                "-Z",
                preset["name"],
            ],
            cb=encode_callback,
        )

        if returncode != 0:
            self.logger.error(f"Could not encode file: {input_file}")
            self.logger.error(f"HandBrakeCLI output:\n{stderr}")
            raise ValueError(f"Could not encode file: {input_file}")

        self.logger.info(f"Successfully encoded {input_file} into {output_file}")

        return returncode, stdout, stderr
