import errno
import time
from subprocess import Popen
from typing import TYPE_CHECKING, Any, Type

if TYPE_CHECKING:
    from .process_manager import ProcessManager


class OpenProcessWrapper:
    def __init__(
        self, pipe: Popen[bytes], manager: "ProcessManager", killtimeout: float = 1.0
    ):
        self._pipe = pipe
        self._manager = manager
        self._timeout = killtimeout
        self._released = False
        self.returncode = None

    def __enter__(self):
        return self

    def __exit__(self, errtype: Type[BaseException] | None, _: Any, __: Any):
        self.returncode = self._pipe.returncode

        # Child process has completed and resource has not been released yet
        if self._pipe.poll() is not None and not self._released:
            return self.release()

        # An exception occurred and resource has not been released yet
        if errtype is not None and not self._released:
            # Try to terminate the child process
            try:
                self._pipe.terminate()
            except OSError as err:
                # If process is not already dead, raise the error
                if err.errno != errno.ESRCH:
                    raise

            # Wait for the child to finish cleaning up
            t_kill = time.time() + self._timeout
            while time.time() < t_kill and self._pipe.poll() is None:
                time.sleep(0.05)

            # Timeout exceeded, just kill the process now
            if self.poll() is None:
                try:
                    self._pipe.kill()
                except OSError as err:
                    # If process is not already dead, raise the error
                    if err.errno != errno.ESRCH:
                        raise
                return self.release()

        # At this point, the process hasn't completed so wait for it and release
        # it afterwards
        self._pipe.wait()
        return self.release()

    def release(self):
        self.returncode = self._pipe.returncode
        if not self._released:
            self._manager.release_process(self._pipe.pid)
            self._released = True

    def poll(self):
        returncode = self._pipe.poll()
        if returncode is not None:
            self.release()
        return returncode

    def wait(self):
        ret = self._pipe.wait()
        self.release()
        return ret

    def communicate(self, input_data: bytes | None = None):
        out = self._pipe.communicate(input_data)
        self.release()
        return out
