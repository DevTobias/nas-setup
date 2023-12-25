from typing import TypedDict


class Disc(TypedDict, total=False):
    type: str
    name: str


class Stream(TypedDict, total=False):
    type: str
    bitrate: str
    lang_code: str
    video_size: str
    video_aspect_ratio: str
    video_frame_rate: str
    audio_sample_rate: str


class Title(TypedDict, total=False):
    duration: str
    disk_size: str
    disk_size_bytes: str
    output_file_name: str
    segments_count: int
    segments_map: int
    streams: dict[int, Stream]


class TitleMetrics(TypedDict):
    title: int
    duration: int
    size: int
    chapters: int
    subtitle_streams: int
    audio_streams: int
    video_streams: int
