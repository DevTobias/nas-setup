import logging
import os
import sys

from autorip.config import Config


class Logger:
    """
    A custom logger class that provides logging functionality with different log levels.

    Args:
        - debug (bool): Whether to enable debug logging or not.
        - silent (bool): Whether to disable logging to stdout or not.
    """

    def __init__(self, config: Config) -> None:
        self._config = config.get["logger"]

        loglevel = logging.DEBUG if self._config["debug"] else logging.INFO
        frmt = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s", "%Y-%m-%d %H:%M:%S"
        )

        self._log = logging.getLogger(os.path.basename(sys.argv[0]))
        self._log.setLevel(loglevel)

        if not self._config["silent"]:
            self._stream_handler = logging.StreamHandler(sys.stdout)
            self._stream_handler.setLevel(loglevel)
            self._stream_handler.setFormatter(frmt)
            self._log.addHandler(self._stream_handler)

    def __del__(self):
        if not self._log.handlers:
            return

        self._log.removeHandler(self._stream_handler)
        self._stream_handler.close()

    def debug(self, msg: str):
        """
        Log a message with severity 'DEBUG'.
        """
        self._log.debug(msg)

    def info(self, msg: str):
        """
        Log a message with severity 'INFO'.
        """
        self._log.info(msg)

    def warn(self, msg: str):
        """
        Log a message with severity 'WARN'.
        """
        self._log.warning(msg)

    def error(self, msg: str):
        """
        Log a message with severity 'ERROR'.
        """
        self._log.error(msg)

    def critical(self, msg: str):
        """
        Log a message with severity 'CRITICAL' and exit the application with status code 1.
        """
        self._log.critical(msg)
        sys.exit(1)
