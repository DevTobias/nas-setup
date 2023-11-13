from ripper import BlueRayRipper
from utils import config


def main():
    ripper = BlueRayRipper(
        config["devices"][0], config["languages"], config["imdb_token"]
    )
    ripper.read_disc_properties()

    # disc, titles = ripper.read_disc_properties()
    # print(json.dumps(titles, indent=2))
    # print(json.dumps(disc, indent=2))

    # print(json.dumps(ripper.detect_main_feature(titles), indent=2))


if __name__ == "__main__":
    main()
