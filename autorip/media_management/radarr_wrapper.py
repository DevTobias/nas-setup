from typing import Any, Literal

import requests
from core.config import Config
from core.logger import Logger


class RadarrWrapper:
    def __init__(self, config: Config, logger: Logger):
        self.config = config
        self.logger = logger

    def create_movie(self, tmdb_id: int):
        movie = self.tmdb_lookup(tmdb_id)
        movie["qualityProfileId"] = self.get_quality_profile_id()
        movie["rootFolderPath"] = self.get_root_folder()
        movie["monitored"] = True
        response = self._radarr_request("movie", "post", movie)
        return self.config.get["media"]["media_dir"] + str(response["folderName"])

    def tmdb_lookup(self, tmdb_id: int):
        return self._radarr_request(f"movie/lookup/tmdb?tmdbId={tmdb_id}", "get")

    def get_movie(self, tmdb_id: int):
        return self._radarr_request(f"movie?tmdbId={tmdb_id}", "get")[0]

    def get_root_folder(self):
        return str(self._radarr_request("rootfolder", "get")[0]["path"])

    def scan_movie(self, tmdb_id: int):
        movie = self.get_movie(tmdb_id)

        self._radarr_request(
            "command",
            "post",
            {"name": "RescanMovie", "movieId": movie["id"]},
        )

    def rename_movie(self, tmdb_id: int):
        movie = self.get_movie(tmdb_id)

        self._radarr_request(
            "command",
            "post",
            {
                "name": "RenameFiles",
                "movieId": movie["id"],
                "files": [movie["movieFile"]["id"]],
            },
        )

    def get_quality_profile_id(self):
        wanted = self.config.get["media"]["radarr_quality_profile"]
        quality_profiles = self._radarr_request("qualityprofile", "get")

        for profile in quality_profiles:
            if profile.get("name") == wanted:
                return str(profile["id"])

        raise RuntimeError(f"Could not find quality profile {wanted}")

    def _radarr_request(
        self, url: str, method: Literal["get", "post"], json: Any = None
    ) -> Any:
        headers = {
            "accept": "application/json",
            "X-Api-Key": self.config.get["media"]["radarr_token"],
        }
        url = f"{self.config.get['media']['radarr_url']}/api/v3/{url}"

        self.logger.debug(f"Making Radarr API request to {url}, {headers}")

        body = (
            requests.get(
                url, timeout=10, headers=headers, json=json, verify=False
            ).json()
            if method == "get"
            else requests.post(
                url, timeout=10, headers=headers, json=json, verify=False
            ).json()
        )

        self.logger.debug(f"Got Radarr response: {body}")
        return body
