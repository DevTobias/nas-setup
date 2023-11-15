from typing import TypedDict


class LoggerConfig(TypedDict):
    silent: bool
    debug: bool


class InputConfig(TypedDict):
    devices: list[str]
    read_from_log: bool


class OutputConfig(TypedDict):
    languages: list[str]
    logging_dir: str
    temporary_rip_dir: str
    output_dir: str


class MetadataConfig(TypedDict):
    imdb_token: str


class AppConfig(TypedDict):
    logger: LoggerConfig
    input: InputConfig
    output: OutputConfig
    metadata: MetadataConfig
