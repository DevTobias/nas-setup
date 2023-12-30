import os
from typing import Any

from api.database.json_storage import JsonStorage
from core.config import Config
from core.logger import Logger
from fastapi import FastAPI
from handbrake.handbrake_wrapper import HandbrakeWrapper
from media_management.uploader import Uploader
from process.process_manager import ProcessManager
from ripper.blueray_ripper import BlueRayRipper


class App(FastAPI):
    def __init__(self, *args: Any, **kwargs: Any):
        super().__init__(*args, **kwargs)

        self.config = Config("autorip.toml")

        if not os.path.exists(self.config.get["output"]["working_dir"]):
            os.makedirs(self.config.get["output"]["working_dir"])

        if not os.path.exists(self.config.get["output"]["logging_dir"]):
            os.makedirs(self.config.get["output"]["logging_dir"])

        self.logger = Logger(self.config)
        self.process_manager = ProcessManager(self.logger)
        self.db = JsonStorage(f"{self.config.get["output"]["logging_dir"]}/db.json")

        self.ripper = BlueRayRipper(self.config, self.logger, self.process_manager)
        self.encoder = HandbrakeWrapper(self.config, self.logger, self.process_manager)
        self.uploader = Uploader(self.config, self.logger)
