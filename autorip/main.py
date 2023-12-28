from typing import Union

from api.app import App


app = App()


@app.post("/rip/{tmdb_id}")
def start_ripper(tmdb_id: int, type: Union[str, None] = None):
    if app.db.get("state") == "ripping":
        return {"status": 400, "msg": "ripping process already running"}

    app.db.set("state", "ripping")
    app.db.set("progress", 0)

    app.ripper.fetch_metadata(tmdb_id, "movie" if type == "movie" else "tv")
    app.db.set("current_metadata", app.ripper.metadata)

    try:
        app.ripper.read_disc_properties().detect_main_feature()
        app.ripper.rip_main_feature(
            "_out/working/", lambda x: app.db.set("progress", x)
        )
        app.db.set("state", "finished")

    except Exception as _:
        app.db.set("state", "error")
        return {"status": 500, "msg": "could not rip disc"}

    return {"status": 200, "msg": f"initiated ripping process for {tmdb_id}"}
