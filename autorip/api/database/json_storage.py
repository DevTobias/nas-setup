import json
import os
from typing import Any


class JsonStorage:
    def __init__(self, path: str):
        self.path = path
        self.data: dict[str, Any] = {}

    def load(self):
        if not os.path.exists(self.path):
            return

        with open(self.path, "r") as f:
            self.data = json.load(f)

    def save(self):
        with open(self.path, "w") as f:
            json.dump(self.data, f, indent=4)

    def get(self, key: str, default: Any = None):
        return self.data.get(key, default)

    def set(self, key: str, value: Any):
        self.data[key] = value
        self.save()

    def delete(self, key: str):
        if key in self.data:
            del self.data[key]
            self.save()

    def keys(self):
        return self.data.keys()

    def values(self):
        return self.data.values()

    def items(self):
        return self.data.items()

    def __getitem__(self, key: str):
        return self.data[key]

    def __setitem__(self, key: str, value: Any):
        self.set(key, value)

    def __delitem__(self, key: str):
        self.delete(key)

    def __contains__(self, key: str):
        return key in self.data

    def __len__(self):
        return len(self.data)
