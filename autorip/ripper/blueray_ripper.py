from typing import TYPE_CHECKING

from misc import logger

if TYPE_CHECKING:
    from process.process_manager import ProcessManager


class BlueRayRipper:
    def __init__(self, device: str, manager: "ProcessManager"):
        self._device = device
        self._manager = manager

    def get_disc_properties(self):
        code, sout, serr = self._manager.call(
            ["makemkvcon", "-r", "info", f"dev:{self._device}"]
        )

        print(code, sout, serr)

        if code != 0:
            logger.error(f"Could not acquire blue-ray title info from {self._device}")
            logger.error(f"makemkvcon output:\n{serr}")
            return None
