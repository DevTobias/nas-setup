import tomllib
from jsonschema import validate

from .config_types import AppConfig
from .schema import config_schema


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
