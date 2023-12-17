import { ActionRowBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';

import { Command } from '$utils/discord/command';

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

    if (type === 'movie') {
      const movie = movieStore.searchMovie(name);
      if (!movie) return interaction.reply({ content: 'Der Film konnte nicht gefunden werden', ephemeral: true });
      return interaction.reply({ content: `Der Film **${movie.meta.title}** wird nun abgespielt.` });
    }

    if (type === 'tv_show') {
      const show = tvShowStore.searchTvShow(name);
      if (!show) return interaction.reply({ content: 'Die Serie konnte nicht gefunden werden', ephemeral: true });

      const select = new StringSelectMenuBuilder()
        .setCustomId('season')
        .setPlaceholder('Wähle eine Staffel aus')
        .addOptions(
          show.meta.seasons.map((season) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(season.name)
              .setValue(season.id.toString())
              .setDescription(
                season.overview === '' ? `${show.meta.overview.slice(0, 90)}...` : `${season.overview.slice(0, 90)}...`
              )
          )
        );

      const row = new ActionRowBuilder().addComponents(select);
      const seasonResponse = interaction.reply({
        content: `### Starte Stream für: **${show.meta.name}**\nWähle die Staffel aus, die du schauen möchtest.`,
        components: [row as never],
      });

      
    }

    interaction.reply({ content: 'Suche nach deiner Serie oder deinem Film...', ephemeral: true });
  },
};
