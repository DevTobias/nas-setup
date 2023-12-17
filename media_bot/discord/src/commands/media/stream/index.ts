import {
  ActionRowBuilder,
  ComponentType,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';

import { handleMovieRequest } from '$commands/media/stream/helper/handleMovieRequest';
import { createMediaControlButtons } from '$features/media/discord/createMediaControlButtons';
import { Command } from '$utils/discord/command';
import { trunc } from '$utils/trunc';

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
    .addStringOption((option) => option.setName('name').setDescription('Name der Serie oder des Films.').setRequired(true)),
  run: async ({ movieStore, tvShowStore }, interaction) => {
    const type = interaction.options.get('type')!.value!.toString() as 'tv_show' | 'movie';
    const name = interaction.options.get('name')!.value!.toString();

    const controlActions = createMediaControlButtons();

    if (type === 'movie') {
      const movie = movieStore.searchMovie(name);

      if (!movie) {
        return interaction.reply({ content: `Der Film **${name}** konnte nicht gefunden werden`, ephemeral: true });
      }

      return handleMovieRequest(interaction, controlActions, movie.meta);
    }

    if (type === 'tv_show') {
      const show = tvShowStore.searchTvShow(name);
      if (!show) return interaction.reply({ content: 'Die Serie konnte nicht gefunden werden', ephemeral: true });

      const selectSeason = new StringSelectMenuBuilder()
        .setCustomId('season')
        .setPlaceholder('Wähle eine Staffel aus')
        .addOptions(
          show.meta.seasons.map((season) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(season.name)
              .setValue(season.season_number.toString())
              .setDescription(season.overview === '' ? trunc(show.meta.overview) : trunc(season.overview))
          )
        );

      const seasonResponse = await interaction.reply({
        content: `### Starte Stream für: **${show.meta.name}**\nWähle die Staffel aus, die du schauen möchtest.`,
        components: [new ActionRowBuilder().addComponents(selectSeason) as never],
      });

      const collector = seasonResponse.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60_000,
      });

      collector.on('collect', async (i) => {
        await i.deferUpdate();
        const selectedSeasonNumber = Number(i.values[0]);

        const season = show.meta.seasons.find((s) => s.season_number === selectedSeasonNumber)!;

        const selectEpisode = new StringSelectMenuBuilder()
          .setCustomId('episode')
          .setPlaceholder('Wähle die Episode aus')
          .addOptions(
            season.episodes.map((episode) =>
              new StringSelectMenuOptionBuilder()
                .setLabel(episode.name)
                .setValue(episode.episode_number.toString())
                .setDescription(episode.overview === '' ? trunc(show.meta.overview) : trunc(episode.overview))
            )
          );

        const episodeResponse = await interaction.editReply({
          content: `### Starte Stream für: **${show.meta.name}** ${season.name}\nWähle die Episode aus, die du schauen möchtest.`,
          components: [new ActionRowBuilder().addComponents(selectEpisode) as never],
        });

        const episodeCollector = episodeResponse.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          time: 60_000,
        });

        episodeCollector.on('collect', async (i2) => {
          await i2.deferUpdate();
          const selectedEpisodeNumber = Number(i2.values[0]);

          const episode = season.episodes.find((e) => e.episode_number === selectedEpisodeNumber)!;

          await interaction.editReply({
            content: `### Starte Stream für: **${show.meta.name}** ${season.name} ${episode.name}`,
            components: [],
          });

          episodeCollector.stop();
        });

        collector.stop();
      });
    }
  },
};
