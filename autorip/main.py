import time
from typing import Union

from api.app import App
from fastapi import BackgroundTasks

app = App()


class RipperCallback:
    def __init__(self):
        self.last_set_time = time.time()

    def call(self, progress: float):
        current_time = time.time()
        time_elapsed = current_time - self.last_set_time

        if time_elapsed >= 5:
            app.db.set("progress", progress)
            self.last_set_time = current_time


class EncoderCallback:
    def __init__(self):
        self.last_set_time = time.time()
        self._last_progress = 0
        self._last_eta = 0

    def call(self, key: str, value: float):
        if key == "progress":
            self._last_progress = value
        elif key == "eta":
            self._last_eta = value

        current_time = time.time()
        time_elapsed = current_time - self.last_set_time

        if time_elapsed >= 5:
            app.db.set("progress", self._last_progress)
            app.db.set("eta", self._last_eta)
            self.last_set_time = current_time


class UploaderCallback:
    def __init__(self):
        self.last_set_time = time.time()

    def call(self, progress: float, eta: float):
        current_time = time.time()
        time_elapsed = current_time - self.last_set_time

        if time_elapsed >= 5:
            app.db.set("progress", progress)
            app.db.set("eta", eta)
            self.last_set_time = current_time


@app.post("/rip/{tmdb_id}")
async def start_ripper(
    tmdb_id: int, background_tasks: BackgroundTasks, media_type: Union[str, None] = None
):
    if app.db.get("state") != "finished" and app.db.get("state") != "rip_error":
        return {"status": 400, "msg": "ripping process already running"}

    media_type = "movie" if media_type == "movie" else "tv"

    def rip_disc():
        app.ripper.fetch_metadata(tmdb_id, media_type)
        app.db.set("current_metadata", app.ripper.metadata)

        encoder_callback = EncoderCallback()
        uploader_callback = UploaderCallback()
        ripper_callback = RipperCallback()

        try:
            app.db.set("state", "ripping")
            app.db.set("progress", 0)

            working_dir = app.config.get["output"]["working_dir"]

            app.ripper.read_disc_properties().detect_main_feature()
            (rip_name, rip_path) = app.ripper.rip_main_feature(
                f"{working_dir}/ripping/", ripper_callback.call
            )

            app.db.set("state", "encoding")
            app.db.set("progress", 0)
            app.db.set("eta", 0)

            encoded_path = f"{working_dir}/encoding/{rip_name}"
            app.encoder.encode_file(
                rip_path, encoded_path, media_type, encoder_callback.call
            )

            app.db.set("state", "uploading")
            app.db.set("progress", 0)
            app.db.set("eta", 0)

            app.uploader.upload_file(
                encoded_path, tmdb_id, media_type, uploader_callback.call
            )

            app.db.set("progress", 1)
            app.db.set("eta", 0)
            app.db.set("state", "finished")

        except Exception as err:
            app.db.set("state", "rip_error")
            app.logger.error(f"Error while ripping disc: {err}")

    background_tasks.add_task(rip_disc)

    return {"status": 200, "msg": f"initiated ripping process for {tmdb_id}"}


@app.get("/data")
def get_state():
    return {"status": 200, "data": app.db.data}
