from typing import List, TypedDict

import tomllib
from jsonschema import validate

config_schema = {
    "type": "object",
    "properties": {
        "logger": {
            "type": "object",
            "properties": {"debug": {"type": "boolean"}, "silent": {"type": "boolean"}},
            "required": ["debug", "silent"],
            "additionalProperties": False,
        },
        "input": {
            "type": "object",
            "properties": {
                "device": {"type": "string"},
                "read_from_log": {"type": "boolean"},
            },
            "required": ["device", "read_from_log"],
            "additionalProperties": False,
        },
        "output": {
            "type": "object",
            "properties": {
                "languages": {"type": "array", "items": {"type": "string"}},
                "logging_dir": {"type": "string"},
                "working_dir": {"type": "string"},
                "eject_disc": {"type": "boolean"},
                "presets": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "type": {"type": "string"},
                            "name": {"type": "string"},
                            "path": {"type": "string"},
                        },
                        "required": ["type", "name", "path"],
                        "additionalProperties": False,
                    },
                },
            },
            "required": [
                "languages",
                "logging_dir",
                "eject_disc",
                "working_dir",
                "presets",
            ],
            "additionalProperties": False,
        },
        "metadata": {
            "type": "object",
            "properties": {"imdb_token": {"type": "string"}},
            "required": ["imdb_token"],
            "additionalProperties": False,
        },
        "media": {
            "type": "object",
            "properties": {
                "media_dir": {"type": "string"},
                "radarr_token": {"type": "string"},
                "radarr_quality_profile": {"type": "string"},
                "radarr_url": {"type": "string"},
            },
            "required": [
                "media_dir",
                "radarr_token",
                "radarr_quality_profile",
                "radarr_url",
            ],
            "additionalProperties": False,
        },
    },
    "required": ["input", "output", "metadata", "logger"],
    "additionalProperties": False,
}


class LoggerConfig(TypedDict):
    silent: bool
    debug: bool


class InputConfig(TypedDict):
    device: str
    read_from_log: bool


class PresetConfig(TypedDict):
    type: str
    name: str
    path: str


class MediaConfig(TypedDict):
    radarr_url: str
    radarr_token: str
    radarr_quality_profile: str
    media_dir: str


class OutputConfig(TypedDict):
    languages: list[str]
    logging_dir: str
    working_dir: str
    eject_disc: bool
    presets: List[PresetConfig]


class MetadataConfig(TypedDict):
    imdb_token: str


class AppConfig(TypedDict):
    logger: LoggerConfig
    input: InputConfig
    output: OutputConfig
    metadata: MetadataConfig
    media: MediaConfig


class Config:
    """
    A class representing the configuration of the autorip application.

    Attributes:
        path (str): The path to the configuration file.
    """

    def __init__(self, path: str = "/etc/autorip/autorip.toml"):
        with open(path, "rb") as toml:
            self._raw = tomllib.load(toml)

        self._config = self._validate()

    def _validate(self):
        """
        Validates the configuration instance against the configuration schema and returns
        an AppConfig object.
        """

        validate(instance=self._raw, schema=config_schema)
        return AppConfig(**self._raw)

    def __str__(self) -> str:
        return str(self._config)

    @property
    def get(self) -> AppConfig:
        """
        Returns the current configuration object.
        """
        return self._config
