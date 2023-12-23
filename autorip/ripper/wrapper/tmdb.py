from typing import Any

import requests
from core.config import Config
from core.logger import Logger
from ripper.models.tmdb_responses import MovieResponse, TvResponse


class TMDBWrapper:
    """
    A wrapper class for The Movie Database (TMDb) API.

    Args:
        - api_key (str): The API key for TMDb.
    """

    def __init__(self, config: Config, logger: Logger):
        self._config = config
        self._logger = logger
        self._base_url = "https://api.themoviedb.org/3"

    def search(self, title: str, year: str | None):
        """
        Search for a movie or TV show by title and year (optional).

        Args:
            - title (str): The title of the movie or TV show to search for.
            - year (str | None): The year the movie or TV show was released (optional).

        Returns:
            A tuple containing the media ID and media type if found, otherwise None.
        """

        multi_url = f"{self._base_url}/search/multi?query={title}&language=en-US"
        results = self._tmdb_request(multi_url)["results"]

        self._logger.debug(f"Got TMDb search results: {results}")

        if year:
            results = [
                result
                for result in results
                if result.get("release_date", "").startswith(year)
            ]
            self._logger.debug(f"Filtered TMDb search results by year: {results}")

        media_id, media_type = results[0].get("id"), results[0].get("media_type")
        self._logger.info(f"Got TMDb search result: {media_id}, {media_type}")
        return (media_id, media_type) if results else None

    def get_movie_details(self, movie_id: int) -> MovieResponse:
        """
        Get details for a movie by its ID.

        Args:
            - movie_id (int): The ID of the movie to get details for.

        Returns:
            A dictionary containing the movie's ID, IMDb ID, year, runtime, and title.
        """

        result = self._tmdb_request(f"{self._base_url}/movie/{movie_id}?language=en-US")
        movie: MovieResponse = {
            "id": result["id"],
            "imdb_id": result["imdb_id"],
            "year": result["release_date"].split("-")[0],
            "runtime": result["runtime"],
            "title": result["title"],
        }
        self._logger.info(f"Got movie details: {movie}")
        return movie

    def get_tv_details(self, tv_id: int) -> TvResponse:
        """
        Get details for a TV show by its ID.

        Args:
            - tv_id (int): The ID of the TV show to get details for.

        Returns:
            A dictionary containing the TV show's ID, name, episode run time, first air date,
            last air date, number of episodes, and number of seasons.
        """

        result = self._tmdb_request(f"{self._base_url}/tv/{tv_id}?language=en-US")
        tv: TvResponse = {
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
