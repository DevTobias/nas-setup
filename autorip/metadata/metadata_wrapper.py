from typing import Any

import requests
from core.config import Config
from core.logger import Logger

from metadata.models.metadata import MovieMetadata, TvMetadata


class MetadataWrapper:
    """
    A wrapper class for interacting with the TMDb API.

    Args:
        - config (Config): The configuration object.
        - logger (Logger): The logger object.
    """

    BASE_URL = "https://api.themoviedb.org/3"

    def __init__(self, config: Config, logger: Logger):
        self._config = config
        self._logger = logger

    def get_movie_details(self, movie_id: int) -> MovieMetadata:
        """
        Get details for a movie by its ID.

        Args:
            - movie_id (int): The ID of the movie to get details for.

        Returns:
            A dictionary containing the movie's ID, IMDb ID, year, runtime, and title.
        """

        result = self._tmdb_request(f"{self.BASE_URL}/movie/{movie_id}?language=en-US")
        movie: MovieMetadata = {
            "id": result["id"],
            "imdb_id": result["imdb_id"],
            "year": result["release_date"].split("-")[0],
            "runtime": result["runtime"],
            "title": result["title"],
        }
        self._logger.info(f"Got movie details: {movie}")
        return movie

    def get_tv_details(self, tv_id: int) -> TvMetadata:
        """
        Get details for a TV show by its ID.

        Args:
            - tv_id (int): The ID of the TV show to get details for.

        Returns:
            A dictionary containing the TV show's ID, name, episode run time, first air date,
            last air date, number of episodes, and number of seasons.
        """

        result = self._tmdb_request(f"{self.BASE_URL}/tv/{tv_id}?language=en-US")
        tv: TvMetadata = {
            "id": result["id"],
            "name": result["name"],
            "episode_run_time": result["episode_run_time"][0],
            "first_air_date": result["first_air_date"].split("-")[0],
            "last_air_date": result["last_air_date"].split("-")[0],
            "number_of_episodes": result["number_of_episodes"],
            "number_of_seasons": result["number_of_seasons"],
        }
        self._logger.info(f"Got TV show details: {tv}")
        return tv

    def _tmdb_request(self, url: str) -> Any:
        """
        Send a request to TMDb API.

        Args:
            - url (str): The URL to send the request to.

        Returns:
            The JSON response from the API as string.
        """

        headers = {
            "accept": "application/json",
            "Authorization": f"Bearer {self._config.get['metadata']['imdb_token']}",
        }
        self._logger.debug(f"Making TMDb request to {url}, {headers}")
        body = requests.get(url, timeout=10, headers=headers).json()
        self._logger.debug(f"Got TMDb response: {body}")
        return body
