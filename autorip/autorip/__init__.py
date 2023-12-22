from .config import Config
from .logger import Logger
from .process import ProcessManager
from .ripper import BlueRayRipper


def main():
    config = Config("autorip/autorip.toml")
    logger = Logger(config)
    process_manager = ProcessManager(logger)

    ripper = BlueRayRipper(config, logger, process_manager)

    ripper.read_disc_properties().detect_main_feature()
    print(ripper.main_feature)
