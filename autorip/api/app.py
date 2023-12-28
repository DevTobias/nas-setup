from typing import Any

from fastapi import FastAPI
from api.database.json_storage import JsonStorage

from core.config import Config
from core.logger import Logger
from process.process_manager import ProcessManager
from ripper.blueray_ripper import BlueRayRipper


class App(FastAPI):
    def __init__(self, *args: Any, **kwargs: Any):
        super().__init__(*args, **kwargs)

        self.config = Config("autorip.toml")
        self.logger = Logger(self.config)
        self.process_manager = ProcessManager(self.logger)
        self.db = JsonStorage("db.json")
        self.ripper = BlueRayRipper(self.config, self.logger, self.process_manager)
