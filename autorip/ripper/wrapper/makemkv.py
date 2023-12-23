from core.config import Config
from core.logger import Logger
from process.process_manager import ProcessManager


class MakeMKVWrapper:
    """
    A wrapper class for the MakeMKV command-line tool.

    Args:
        - device (str): The device path to the optical drive.
        - read_from_log (bool, optional): Whether to read disc properties from a log file for
        faster development. Defaults to False.
    """

    def __init__(self, config: Config, logger: Logger, process_manager: ProcessManager):
        self._config = config
        self._logger = logger
        self._process_manager = process_manager

    def read_disc_properties(self) -> tuple[int, str, str]:
        """
        Reads the disc properties using the makemkvcon64 command line tool.

        Returns:
            A tuple containing the return code, stdout, and stderr of the command.
            If the command fails, returns None.
        """

        logging_dir = self._config.get["output"]["logging_dir"]

        if self._config.get["input"]["read_from_log"]:
            with open(f"{logging_dir}/stdout.log", "r", encoding="utf-8") as f:
                return 0, f.read(), ""

        device = self._config.get["input"]["devices"][0]

        returncode, stdout, stderr = self._process_manager.call(
            ["makemkvcon64", "-r", "info", f"dev:{device}"],
            cb=self._logger.debug,
        )

        if returncode != 0:
            self._logger.error(f"Could not acquire blue-ray title info from {device}")
            self._logger.error(f"makemkvcon output:\n{stderr}")
            raise ValueError("Could not acquire blue-ray title info from {device}")

        with open(f"{logging_dir}/stdout.log", "w", encoding="utf-8") as f:
            f.write(stdout)

        return returncode, stdout, stderr
