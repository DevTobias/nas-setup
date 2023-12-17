import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js';

import { createActionButtons } from '$features/media/discord/createActionButtons';
import { createMediaEmbed } from '$features/media/discord/createMediaEmbed';
import { createPaginationFooter } from '$features/media/discord/createPaginationFooter';
import { highlightResults } from '$features/media/discord/highlightResults';
import { Command } from '$utils/discord/command';

export const TvShows: Command = {
  data: new SlashCommandBuilder()
    .setName('tv-shows')
    .setDescription('Liefert eine Liste aller verfügbaren Serien.')
    .addStringOption((option) => option.setName('name').setDescription('Suche nach bestimmten Serien.')),
  run: async ({ tvShowStore }, interaction) => {
    let currentPage = 0;

    const query = interaction.options.get('name')?.value?.toString();
    await interaction.deferReply();
    const [actions, next, previous] = createActionButtons();

    const sendTvShowOverview = async () => {
      const [titles, image] = await tvShowStore.getTvShows(currentPage, query);

      if (!image || titles.length === 0) {
        return interaction.editReply({ content: 'Keine Serien gefunden.' });
      }

      next.setDisabled(currentPage === tvShowStore.maxPages - 1);
      previous.setDisabled(currentPage === 0);

      const attachment = new AttachmentBuilder(image, { name: 'media-overview.png' });
      const description = highlightResults(titles, query).join('\n');
      const footer = createPaginationFooter(tvShowStore.searchResults, currentPage + 1, tvShowStore.maxPages);
      const embed = createMediaEmbed(description, footer);

      return interaction.editReply({ files: [attachment], components: [actions as never], embeds: [embed] });
    };

    (await sendTvShowOverview()).createMessageComponentCollector({ time: 3_600_000 }).on('collect', async (confirmation) => {
      if (confirmation.customId === 'next') currentPage += 1;
      else if (confirmation.customId === 'previous') currentPage -= 1;
      await confirmation.deferUpdate();
      await sendTvShowOverview();
    });
  },
};
