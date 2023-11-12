from process import process_manager
from ripper import BlueRayRipper


def main():
    ripper = BlueRayRipper("/mnt/f", process_manager)
    ripper.get_disc_properties()


if __name__ == "__main__":
    main()
