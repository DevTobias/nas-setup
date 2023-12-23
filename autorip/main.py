# eject -vm sr0
from core.config import Config
from core.logger import Logger
from process.process_manager import ProcessManager


def main():
    config = Config("autorip.toml")
    logger = Logger(config)
    ProcessManager(logger)
    print(config)

    #
    # ripper = BlueRayRipper(config, logger, process_manager)
    #
    # ripper.read_disc_properties().detect_main_feature()
    # print(ripper.main_feature)


if __name__ == "__main__":
    main()
