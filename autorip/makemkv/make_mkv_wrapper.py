import csv
import os

from core.config import Config
from core.logger import Logger
from core.utils.typing_utils import aware
from process.process_manager import ProcessManager

from makemkv.constants.makemkv_attributes import MAKEMKV_ATTRIBUTE_ENUMS
from makemkv.models.disc_properties import Disc, Stream, Title


class MakeMKVWrapper:
    """
    A wrapper class for interacting with MakeMKV, a command line tool for ripping Blu-ray discs.

    Args:
        config (Config): The configuration object.
        logger (Logger): The logger object.
        process_manager (ProcessManager): The process manager object.
    """

    def __init__(self, config: Config, logger: Logger, process_manager: ProcessManager):
        self._config = config
        self._logger = logger
        self._process_manager = process_manager

    ################################################################################################
    # Metadata-Gathering                                                   #
    ################################################################################################

    def read_disc_properties(self):
        """
        Reads the properties of a disc using MakeMKV.

        Returns:
            A tuple containing the disc properties and title properties.
            The disc properties are represented as a dictionary, where the keys are the property
            names and the values are the corresponding property values.
            The title properties are represented as a dictionary of dictionaries, where the keys are
            the title numbers and the values are dictionaries representing the title properties.
            Each title dictionary contains the title properties as key-value pairs.
        """

        properties = self._read_raw_disc_properties()

        _, stdout, _ = properties
        parsed = list(csv.reader(stdout.split("\n")))

        def save_value(obj: Disc | Title | Stream, prop: int | str, value: int | str):
            if prop in MAKEMKV_ATTRIBUTE_ENUMS:
                obj[MAKEMKV_ATTRIBUTE_ENUMS[prop]] = value

        disc: Disc = {}
        titles: dict[int, Title] = {}

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
                save_value(disc, data[1], data[3])

            # Parse title info
            elif key == "TINFO":
                title = int(data[1])
                titles.setdefault(title, {})
                save_value(titles[title], data[2], data[4])

            # Parse stream info
            elif key == "SINFO":
                title, stream = int(data[1]), int(data[2])
                titles[title].setdefault("streams", {}).setdefault(stream, {})
                save_value(
                    aware(titles[title].get("streams"))[stream], data[3], data[5]
                )

        self._logger.info(f"Successfully read disc properties: {disc}")
        self._logger.info(f"Successfully read title properties: {titles}")

        return (disc, titles)

    def _read_raw_disc_properties(self) -> tuple[int, str, str]:
        """
        Reads the disc properties using the makemkvcon command line tool.

        Returns:
            A tuple containing the return code, stdout, and stderr of the command.
            If the command fails, returns None.
        """

        logging_dir = self._config.get["output"]["logging_dir"]

        if self._config.get["input"]["read_from_log"]:
            with open(f"{logging_dir}/stdout.log", "r", encoding="utf-8") as f:
                return 0, f.read(), ""

        device = self._config.get["input"]["device"]

        self._logger.info(f"Reading disc properties from {device}")

        returncode, stdout, stderr = self._process_manager.call(
            ["makemkvcon", "-r", "info", f"dev:{device}"],
            cb=self._logger.debug,
        )

        if returncode != 0:
            self._logger.error(f"Could not acquire blue-ray title info from {device}")
            self._logger.error(f"makemkvcon output:\n{stderr}")
            raise ValueError("Could not acquire blue-ray title info from {device}")

        with open(f"{logging_dir}/stdout.log", "w", encoding="utf-8") as f:
            f.write(stdout)

        return returncode, stdout, stderr

    ################################################################################################
    # Actual ripping process                                                                       #
    ################################################################################################

    def rip_blue_ray(self, title: int) -> tuple[int, str, str]:
        """
        Rips the main feature of a blue-ray disc using the makemkvcon command line tool.

        Args:
            - title (str): The title id of the blue-ray disc to rip.

        Returns:
            A tuple containing the return code, stdout, and stderr of the command.
            If the command fails, returns None.
        """

        device = self._config.get["input"]["device"]
        output_dir = self._config.get["output"]["working_dir"]

        self._logger.info(
            f"Ripping title with id {title} from {device} into {output_dir}"
        )

        os.makedirs(output_dir, exist_ok=True)
        returncode, stdout, stderr = self._process_manager.call(
            [
                "makemkvcon",
                "--messages=-stdout",
                "--progress=-same",
                "-r",
                "mkv",
                f"dev:{device}",
                f"{title}",
                f"{output_dir}",
            ],
            cb=self._logger.debug,
        )

        if returncode != 0:
            self._logger.error(f"Could not rip blue-ray title {title} from {device}")
            self._logger.error(f"makemkvcon output:\n{stderr}")
            raise ValueError(f"Could not rip blue-ray title {title}")

        self._logger.info(
            f"Successfully ripped title with id {title} from {device} into {output_dir}"
        )

        return returncode, stdout, stderr
