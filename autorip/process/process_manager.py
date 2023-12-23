import errno
import sys
from _thread import allocate_lock
from subprocess import PIPE, Popen
from typing import Callable, Optional

from core.logger import Logger
from core.utils.typing_utils import aware

from process.open_process_wrapper import OpenProcessWrapper


class SpawnLockedException(Exception):
    pass


class ProcessManager:
    """
    A class that manages the execution of external processes.

    Args:
        logger (Logger): A logger instance to log messages.
    """

    def __init__(self, logger: Logger) -> None:
        self._logger = logger
        self._threadlock = allocate_lock()
        self._pids: set[int] = set()
        self._startlock = False

    def call(self, args: list[str], cb: Optional[Callable[[str], None]] = None):
        """
        Executes a command with the given arguments and returns the output and error streams.

        Args:
            - args (list[str]): The command and its arguments to execute.
            - cb (Optional[Callable[[str], None]]): An optional callback function to
            receive the output stream line by line.

        Returns:
            Tuple[int, str, str]: A tuple containing the return code, the output
            stream and the error stream.
        """
        try:
            with self._open_process(args, stdout=PIPE, stderr=PIPE) as pipe:
                self._logger.info(f"Executing {" ".join(args)}")
                sout = ""

                for line in iter(aware(pipe.raw.stdout).readline, b""):
                    parsed_line = line.decode("utf-8").strip()
                    sout += parsed_line + "\n"

                    if cb:
                        cb(parsed_line)

                remain_sout, serr = pipe.communicate()
                sout, serr = (
                    f"{sout}\n{remain_sout.decode("utf-8").strip()}",
                    serr.decode("utf-8").strip(),
                )

                return (pipe.returncode, sout, serr)

        except OSError as err:
            if err.errno == errno.ENOENT:
                self._logger.error(f"{args[0]} could not be found. Is it installed?")
            raise

    def add_process(self, pid: int):
        """
        Add a process to the set of tracked processes.

        Args:
            pid (int): The process ID to add.
        """
        with self._threadlock:
            self._pids.add(pid)

    def release_process(self, pid: int):
        """
        Removes the given process ID from the list of active processes.

        Args:
            pid (int): The process ID to remove.
        """

        with self._threadlock:
            self._pids.remove(pid)

    def lock_process_start(self):
        """
        Acquires the thread lock and sets the _startlock attribute to True.
        """

        with self._threadlock:
            self._startlock = True

    def unlock_process_start(self):
        """
        Unlocks the process start lock.
        """

        with self._threadlock:
            self._startlock = False

    def _open_process(self, args: list[str], stdout: int, stderr: int):
        """
        Spawns a new process with the given arguments and redirects its standard output
        and error streams to the specified file descriptors.

        Args:
            - args (list[str]): The command-line arguments to pass to the process.
            - stdout (int): The file descriptor to use for the process's standard output stream.
            - stderr (int): The file descriptor to use for the process's standard error stream.

        Returns:
            An `OpenProcessWrapper` object that wraps the newly spawned process.
        """

        if self._startlock:
            sys.stdout.flush()
            raise SpawnLockedException("process spawning is locked")

        p = Popen(args, stdout=stdout, stderr=stderr)
        self.add_process(p.pid)
        return OpenProcessWrapper(p, self)
