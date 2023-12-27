import time
from typing import Any

from core.config import Config
from core.logger import Logger
from core.utils.typing_utils import aware
from discord.embeds.movie_embed import create_movie_embed
from nextcord import Intents, Interaction, SlashOption
from nextcord.ext import commands
from process.process_manager import ProcessManager
from ripper.blueray_ripper import BlueRayRipper


class Bot(commands.Bot):
    def __init__(self, *args: Any, **kwargs: Any):
        super().__init__(*args, **kwargs)

        self.config = Config("autorip.toml")
        self.logger = Logger(self.config)
        self.process_manager = ProcessManager(self.logger)

    async def on_ready(self) -> None:
        self.logger.info(f"Logged in as {self.user} (ID: {aware(self.user).id})")


last_event_time = 0
time_threshold = 10_000


def main():
    intents = Intents.default()
    bot = Bot(intents=intents)

    @bot.slash_command(
        description="Starts the ripping process.",
        guild_ids=[bot.config.get["discord"]["guild"]],
    )
    async def start_ripper(
        interaction: Interaction[Bot],
        tmdb_id: int = SlashOption(
            description="The TMDB ID of the movie or tv show.", required=True
        ),
        media_type: str = SlashOption(
            description="The type of media to rip.",
            choices={"Film": "movie", "Serie": "tv"},
            required=True,
        ),
    ):
        await interaction.response.defer()

        ripper = BlueRayRipper(bot.config, bot.logger, bot.process_manager)
        ripper.fetch_metadata(tmdb_id, "movie" if media_type == "movie" else "tv")

        msg = aware(
            await interaction.edit_original_message(
                embed=create_movie_embed(
                    ripper.movie_metadata, aware(interaction.user).id, 0, False
                )
            )
        )

        ripper.read_disc_properties().detect_main_feature()

        def progress_callback(progress: float) -> None:
            global last_event_time
            current_time = time.time() * 1000
            if current_time - last_event_time >= time_threshold:
                print(f"update {progress}")
                _ = msg.edit(
                    embed=create_movie_embed(
                        ripper.movie_metadata,
                        aware(interaction.user).id,
                        progress,
                        False,
                    )
                )
                last_event_time = current_time

        file_path = ripper.rip_main_feature("_out/working/", progress_callback)

        await interaction.edit_original_message(content=file_path)

    bot.run(bot.config.get["discord"]["token"])


if __name__ == "__main__":
    main()
