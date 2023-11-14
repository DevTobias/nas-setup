import errno
import sys
from _thread import allocate_lock
from subprocess import PIPE, Popen
from typing import List

from logger import Logger

from .exceptions.spawn_locked_exception import SpawnLockedException
from .open_process_wrapper import OpenProcessWrapper


class ProcessManager:
    def __init__(self, logger: Logger) -> None:
        self._logger = logger
        self._threadlock = allocate_lock()
        self._pids: set[int] = set()
        self._startlock = False

    def call(self, args: List[str]):
        try:
            with self._open_process(args, stdout=PIPE, stderr=PIPE) as pipe:
                sout, serr = pipe.communicate()
                self._logger.debug(f"{args[0]} output:\n{sout}\n{serr}\n")
                return pipe.returncode, sout.decode("utf-8"), serr.decode("utf-8")
        except OSError as err:
            if err.errno == errno.ENOENT:
                self._logger.error(f"{args[0]} could not be found. Is it installed?")
            raise

    def add_process(self, pid: int):
        with self._threadlock:
            self._pids.add(pid)

    def release_process(self, pid: int):
        with self._threadlock:
            self._pids.remove(pid)

    def lock_process_start(self):
        with self._threadlock:
            self._startlock = True

    def unlock_process_start(self):
        with self._threadlock:
            self._startlock = False

    def _open_process(self, args: List[str], stdout: int, stderr: int):
        if self._startlock:
            sys.stdout.flush()
            raise SpawnLockedException("process spawning is locked")

        p = Popen(args, stdout=stdout, stderr=stderr)
        self.add_process(p.pid)
        return OpenProcessWrapper(p, self)
