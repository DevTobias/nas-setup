import os
import sys

from .utils import now


class Logger:
    def __init__(self, verbose: bool) -> None:
        self._program_name = os.path.basename(sys.argv[0])
        self._verbose = verbose

    def info(self, info: str):
        print(f"{self._program_name} ({now()}) INFO: {info}\n")

    def debug(self, msg: str):
        if self._verbose:
            print(f"{self._program_name} ({now()}) DEBUG: {msg}\n")

    def warn(self, warn: str):
        sys.stderr.write(f"{self._program_name} ({now()}) WARNING: {warn}\n")

    def error(self, error: str):
        sys.stderr.write(f"{self._program_name} ({now()}) ERROR: {error}\n")

    def die(self, msg: str):
        sys.stderr.write(f"{self._program_name} ({now()}) FATAL ERROR: {msg}\n")
        sys.exit(1)


logger = Logger(verbose=False)
