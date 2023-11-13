from utils import call_process, config, logger


class MakeMKVWrapper:
    """
    A wrapper class for the MakeMKV command-line tool.

    Args:
        - device (str): The device path to the optical drive.
        - read_from_log (bool, optional): Whether to read disc properties from a log file for
        faster development. Defaults to False.
    """

    def __init__(self, device: str, read_from_log: bool = False) -> None:
        self._device = device
        self._read_from_log = read_from_log

    def read_disc_properties(self) -> tuple[int, str, str] | None:
        """
        Reads the disc properties using the makemkvcon64 command line tool.

        Returns:
            A tuple containing the return code, stdout, and stderr of the command.
            If the command fails, returns None.
        """

        if self._read_from_log:
            with open(f"{config['out_dir']}/stdout.log", "r", encoding="utf-8") as f:
                return 0, f.read(), ""

        returncode, stdout, stderr = call_process(
            ["makemkvcon64", "-r", "info", f"dev:{self._device}"]
        )

        if returncode != 0:
            logger.error(f"Could not acquire blue-ray title info from {self._device}")
            logger.error(f"makemkvcon output:\n{stderr}")
            return None

        with open(f"{config['out_dir']}/stdout.log", "w", encoding="utf-8") as f:
            f.write(stdout)

        return returncode, stdout, stderr
