from typing import TypedDict


class MovieMetadata(TypedDict):
    id: str
    imdb_id: str
    title: str
    runtime: int
    year: str


class TvMetadata(TypedDict):
    id: str
    name: str
    episode_run_time: int
    first_air_date: str
    last_air_date: str
    number_of_episodes: int
    number_of_seasons: int
