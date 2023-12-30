import json
import os
from typing import Any


class JsonStorage:
    def __init__(self, path: str):
        self.path = path
        self._data: dict[str, Any] = {}
        self.load()

    @property
    def data(self):
        return self._data

    def load(self):
        if not os.path.exists(self.path):
            return

        with open(self.path, "r", encoding="utf-8") as f:
            self._data = json.load(f)

    def save(self):
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(self._data, f, indent=4)

    def get(self, key: str, default: Any = None):
        return self._data.get(key, default)

    def set(self, key: str, value: Any):
        self._data[key] = value
        self.save()

    def delete(self, key: str):
        if key in self._data:
            del self._data[key]
            self.save()

    def keys(self):
        return self._data.keys()

    def values(self):
        return self._data.values()

    def items(self):
        return self._data.items()

    def __getitem__(self, key: str):
        return self._data[key]

    def __setitem__(self, key: str, value: Any):
        self.set(key, value)

    def __delitem__(self, key: str):
        self.delete(key)

    def __contains__(self, key: str):
        return key in self._data

    def __len__(self):
        return len(self._data)
