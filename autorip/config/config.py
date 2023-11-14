import tomllib
from jsonschema import validate

from .schema import config_schema
from .types import AppConfig


class Config:
    def __init__(self, path: str = "/etc/autorip/autorip.toml"):
        with open(path, "rb") as toml:
            self._raw = tomllib.load(toml)

        self._config = self._validate()

    def _validate(self):
        validate(instance=self._raw, schema=config_schema)
        return AppConfig(**self._raw)

    def __str__(self) -> str:
        return str(self._config)

    @property
    def get(self) -> AppConfig:
        return self._config
