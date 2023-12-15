import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import { SeriesStore } from '$features/series/SeriesStore';
import { Command } from '$utils/discord/command';

const store = new SeriesStore();

export const Series: Command = {
  data: new SlashCommandBuilder().setName('series').setDescription('Returns all available series to stream.'),
  run: async (_, interaction) => {
    let currentPage = 0;

    const query = interaction.options.get('query')?.value?.toString();

    await interaction.deferReply();

    const next = new ButtonBuilder({ custom_id: 'next', emoji: '➡️', style: ButtonStyle.Secondary });
    const previous = new ButtonBuilder({ custom_id: 'previous', emoji: '⬅️', style: ButtonStyle.Secondary });
    const actions = new ActionRowBuilder().addComponents(previous, next);

    const sendImage = async () => {
      const movies = await store.getSeries(currentPage, query);

      if (!movies) {
        return interaction.editReply({ content: 'No series found.' });
      }

      const [titles, image] = movies;

      next.setDisabled(currentPage === store.maxPages - 1);
      previous.setDisabled(currentPage === 0);

      const attachment = new AttachmentBuilder(image, { name: `series-${currentPage}.png` });

      const highlightedTitles = titles.map((title) =>
        query ? title.replace(new RegExp(query, 'gi'), `**${query}**`) : title
      );

      const footer = `${store.searchResults} Ergebnisse ${query ? `für ${query}` : ''} gefunden.\nSeite ${
        currentPage + 1
      } von ${store.maxPages}`;

      const embed = new EmbedBuilder()
        .setColor('#e4a011')
        .setTitle('Verfügbare Serien 🎞️')
        .setDescription(highlightedTitles.join('\n'))
        .setFooter({ text: footer, iconURL: interaction.user.displayAvatarURL() })
        .setImage(`attachment://series-${currentPage}.png`);

      return interaction.editReply({ files: [attachment], components: [actions as never], embeds: [embed] });
    };

    const response = await sendImage();
    const collector = response.createMessageComponentCollector({ time: 3_600_000 });

    collector.on('collect', async (confirmation) => {
      if (confirmation.customId === 'next') currentPage += 1;
      else if (confirmation.customId === 'previous') currentPage -= 1;

      await confirmation.deferUpdate();
      await sendImage();
    });
  },
};
