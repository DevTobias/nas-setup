from core.config import Config
from core.logger import Logger
from process.process_manager import ProcessManager
from ripper.blueray_ripper import BlueRayRipper


def main():
    config = Config("autorip.toml")
    logger = Logger(config)
    process_manager = ProcessManager(logger)

    ripper = (
        BlueRayRipper(config, logger, process_manager)
        .read_disc_properties(345887, "movie")
        .detect_main_feature()
    )

    file_path = ripper.rip_main_feature("_out/working/")
    print(file_path)


if __name__ == "__main__":
    main()
