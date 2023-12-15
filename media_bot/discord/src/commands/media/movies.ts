import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js';

import { createActionButtons } from '$commands/media/helper/createActionButtons';
import { createMediaEmbed } from '$commands/media/helper/createMediaEmbed';
import { createPaginationFooter } from '$commands/media/helper/createPaginationFooter';
import { highlightResults } from '$commands/media/helper/highlightResults';
import { MovieStore } from '$features/media/MovieStore';
import { Command } from '$utils/discord/command';

const store = new MovieStore();

export const Movies: Command = {
  data: new SlashCommandBuilder()
    .setName('movies')
    .setDescription('Listet alle verfügbaren Filme auf.')
    .addStringOption((option) => option.setName('name').setDescription('Suche nach einem bestimmten Film.')),
  run: async (_, interaction) => {
    let currentPage = 0;

    const query = interaction.options.get('name')?.value?.toString();
    await interaction.deferReply();
    const [actions, next, previous] = createActionButtons();

    const sendMovieDetails = async () => {
      const [titles, image] = await store.getMovies(currentPage, query);

      if (!image || titles.length === 0) {
        return interaction.editReply({ content: 'Keine Filme gefunden.' });
      }

      next.setDisabled(currentPage === store.maxPages - 1);
      previous.setDisabled(currentPage === 0);

      const attachment = new AttachmentBuilder(image, { name: 'media-overview.png' });
      const description = highlightResults(titles, query).join('\n');
      const footer = createPaginationFooter(store.searchResults, currentPage + 1, store.maxPages);
      const embed = createMediaEmbed(description, footer);

      return interaction.editReply({ files: [attachment], components: [actions as never], embeds: [embed] });
    };

    (await sendMovieDetails()).createMessageComponentCollector({ time: 3_600_000 }).on('collect', async (confirmation) => {
      if (confirmation.customId === 'next') currentPage += 1;
      else if (confirmation.customId === 'previous') currentPage -= 1;

      await confirmation.deferUpdate();
      await sendMovieDetails();
    });
  },
};
