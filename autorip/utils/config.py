from typing import TypedDict, cast

from dotenv import dotenv_values


class RawConfig(TypedDict):
    MONITOR_DEVICES: str
    IMDB_TOKEN: str
    LANGUAGES: str
    OUT_DIR: str


class Config(TypedDict):
    devices: list[str]
    imdb_token: str
    languages: list[str]
    out_dir: str


raw_config = cast(RawConfig, dotenv_values("autorip.env"))


config: Config = {
    "devices": raw_config.get("MONITOR_DEVICES").split(","),
    "imdb_token": raw_config.get("IMDB_TOKEN"),
    "languages": raw_config.get("LANGUAGES").split(","),
    "out_dir": raw_config.get("OUT_DIR"),
}
