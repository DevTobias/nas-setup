import { ComponentType, SlashCommandBuilder } from 'discord.js';

import { createMediaControlButtons } from '$commands/media/stream/helper/createMediaControlButtons';
import { createSelectEpisodeActions } from '$commands/media/stream/helper/createSelectEpisodeActionts';
import { createSelectSeasonActions } from '$commands/media/stream/helper/createSelectSeasonActions';
import { createSelectTvEmbed } from '$commands/media/stream/helper/createSelectTvEmbed';
import { handleEpisodeRequest } from '$commands/media/stream/subcommands/handleEpisodeRequest';
import { handleMovieRequest } from '$commands/media/stream/subcommands/handleMovieRequest';
import { config } from '$config';
import { TvEpisode, TvSeason } from '$features/media/TvShowStore';
import { Command } from '$utils/discord/command';
import { connectToWebSocket } from '$utils/ws';

export const Stream: Command = {
  data: new SlashCommandBuilder()
    .setName('stream')
    .setDescription('Startet den Stream für ein ausgewähltes Medium.')
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('Entscheidet ob eine Serie oder ein Film abgespielt werden soll.')
        .setRequired(true)
        .addChoices({ name: 'Serie', value: 'tv_show' }, { name: 'Film', value: 'movie' })
    )
    .addStringOption((option) => option.setName('name').setDescription('Name der Serie oder des Films.').setRequired(true))
    .addStringOption((option) => option.setName('start').setDescription('Start des Mediums im Format [[hh:]mm:]ss[.xxx].')),
  run: async ({ movieStore, tvShowStore }, interaction) => {
    await interaction.deferReply();

    const type = interaction.options.get('type')!.value!.toString() as 'tv_show' | 'movie';
    const name = interaction.options.get('name')!.value!.toString();
    const start = interaction.options.get('start')?.value?.toString();

    const controlActions = createMediaControlButtons();
    const socket = await connectToWebSocket(config.STREAMER_ENDPOINT);

    if (type === 'movie') {
      const movie = movieStore.search(name);

      if (!movie) {
        return interaction.editReply({ content: `Der Film **${name}** konnte nicht gefunden werden` });
      }

      return handleMovieRequest(interaction, socket, controlActions, movie.meta, start);
    }

    if (type === 'tv_show') {
      const tv = tvShowStore.search(name);

      if (!tv) {
        return interaction.editReply({ content: `Die Serie **${name}** konnte nicht gefunden werden` });
      }

      const selectEmbed = createSelectTvEmbed(tv.meta, interaction.user);

      const selectSeasonAction = createSelectSeasonActions(tv.meta);
      const seasonResponse = await interaction.editReply({ embeds: [selectEmbed], components: [selectSeasonAction] });

      const selectedSeason = await new Promise<TvSeason>((resolve) => {
        const seasonCollector = seasonResponse.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          time: 60_000,
        });

        seasonCollector.on('collect', async (selection) => {
          await selection.deferUpdate();
          const selectedSeasonNumber = Number(selection.values[0]);
          const season = tv.meta.seasons.find((s) => s.season_number === selectedSeasonNumber)!;
          seasonCollector.stop();
          resolve(season);
        });
      });

      const selectEpisodeActions = createSelectEpisodeActions(selectedSeason);
      const episodeResponse = await interaction.editReply({ embeds: [selectEmbed], components: [selectEpisodeActions] });

      const selectedEpisode = await new Promise<TvEpisode>((resolve) => {
        const episodeCollector = episodeResponse.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          time: 60_000,
        });

        episodeCollector.on('collect', async (selection) => {
          await selection.deferUpdate();
          const selectedEpisodeNumber = Number(selection.values[0]);
          const episode = selectedSeason.episodes.find((e) => e.episode_number === selectedEpisodeNumber)!;
          episodeCollector.stop();
          resolve(episode);
        });
      });

      return handleEpisodeRequest(interaction, socket, controlActions, tv.meta, selectedSeason, selectedEpisode, start);
    }
  },
};
