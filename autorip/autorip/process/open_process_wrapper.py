import errno
import time
from subprocess import Popen
from typing import TYPE_CHECKING, Any, Type

if TYPE_CHECKING:
    from .process_manager import ProcessManager


class OpenProcessWrapper:
    """
    A context manager that wraps a Popen object and provides additional functionality
    for managing the child process. The context manager ensures that the child process
    is properly terminated and its resources are released when the context is exited.
    """

    def __init__(
        self, pipe: Popen[bytes], manager: "ProcessManager", killtimeout: float = 1.0
    ):
        self._pipe = pipe
        self._manager = manager
        self._timeout = killtimeout
        self._released = False
        self.returncode = None

    def __enter__(self):
        """
        Enter the runtime context related to this object.
        """
        return self

    def __exit__(self, errtype: Type[BaseException] | None, _: Any, __: Any):
        """
        Exit method for the context manager. This method is called when the 'with' block is exited.
        """

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

    @property
    def raw(self):
        """
        Returns the raw pipe object.
        """
        return self._pipe

    def release(self):
        """
        Releases the process and sets the return code. If the process has not been
        released yet, it will be released and the return code will be set to the
        return code of the process.
        """

        self.returncode = self._pipe.returncode
        if not self._released:
            self._manager.release_process(self._pipe.pid)
            self._released = True

    def poll(self):
        """
        Check if the process has terminated.

        Returns:
            The return code of the process if it has terminated, or None if it is still running.
        """

        returncode = self._pipe.poll()
        if returncode is not None:
            self.release()
        return returncode

    def wait(self):
        """
        Wait for the process to terminate and return its exit code.
        """

        ret = self._pipe.wait()
        self.release()
        return ret

    def communicate(self, input_data: bytes | None = None):
        """
        Interact with the process: Send data to stdin. Read data from stdout and stderr, until
        end-of-file is reached. Wait for process to terminate. The optional input argument should
        be a string to be sent to the child process, or None, if no data should be sent to the child
        """

        out = self._pipe.communicate(input_data)
        self.release()
        return out
