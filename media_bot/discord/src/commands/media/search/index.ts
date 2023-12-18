import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js';

import { createMediaEmbed } from '$commands/media/search/helper/createMediaEmbed';
import { createPaginationActions } from '$commands/media/search/helper/createPaginationActions';
import { createPaginationFooter } from '$commands/media/search/helper/createPaginationFooter';
import { highlightSearchResults } from '$features/media/helper/highlightSearchResults';
import { Command } from '$utils/discord/command';

export const Search: Command = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Liefert eine Liste aller verfügbaren Serien oder Filme zurück.')
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('Entscheidet ob eine Serie oder ein Film gesucht werden soll.')
        .setRequired(true)
        .addChoices({ name: 'Serie', value: 'tv_show' }, { name: 'Film', value: 'movie' })
    )
    .addStringOption((option) => option.setName('name').setDescription('Titel des gesuchten Medieninhaltes.')),
  run: async ({ tvShowStore, movieStore }, interaction) => {
    await interaction.deferReply();

    let currentPage = 0;

    const type = interaction.options.get('type')!.value!.toString() as 'tv_show' | 'movie';
    const query = interaction.options.get('name')?.value?.toString();

    const store = type === 'tv_show' ? tvShowStore : movieStore;
    const { paginationActions, nextBtn, previousBtn } = createPaginationActions();

    const sendMediaOverview = async () => {
      const [titles, image] = await store.searchAll(currentPage, query);

      if (!image || titles.length === 0) {
        return interaction.editReply({ content: 'Keine Medieninhalte gefunden <:Sadge:769623385290178571>' });
      }

      nextBtn.setDisabled(currentPage === store.maxPages - 1);
      previousBtn.setDisabled(currentPage === 0);

      const attachment = new AttachmentBuilder(image, { name: 'media-overview.png' });
      const description = highlightSearchResults(titles, query).join('\n');
      const footer = createPaginationFooter(store.searchResults, currentPage + 1, store.maxPages);
      const embed = createMediaEmbed(description, footer);

      return interaction.editReply({ files: [attachment], components: [paginationActions], embeds: [embed] });
    };

    (await sendMediaOverview()).createMessageComponentCollector({ time: 3_600_000 }).on('collect', async (confirmation) => {
      if (confirmation.customId === 'next') currentPage += 1;
      else if (confirmation.customId === 'previous') currentPage -= 1;
      await confirmation.deferUpdate();
      await sendMediaOverview();
    });
  },
};
