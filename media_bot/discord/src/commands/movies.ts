import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import { MovieStore } from '$features/movies/MovieStore';
import { Command } from '$utils/discord/command';

const store = new MovieStore();

export const Movies: Command = {
  data: new SlashCommandBuilder()
    .setName('movies')
    .setDescription('Returns all available movies to stream.')
    .addStringOption((option) => option.setName('query').setDescription('Search for specific movies.')),
  run: async (_, interaction) => {
    let currentPage = 0;

    const query = interaction.options.get('query')?.value?.toString();

    await interaction.deferReply();

    const next = new ButtonBuilder({ custom_id: 'next', emoji: '➡️', style: ButtonStyle.Secondary });
    const previous = new ButtonBuilder({ custom_id: 'previous', emoji: '⬅️', style: ButtonStyle.Secondary });
    const actions = new ActionRowBuilder().addComponents(previous, next);

    const sendImage = async () => {
      const movies = await store.getMovies(currentPage, query);

      if (!movies) {
        return interaction.editReply({ content: 'No movies found.' });
      }

      const [titles, image] = movies;

      next.setDisabled(currentPage === store.maxPages - 1);
      previous.setDisabled(currentPage === 0);

      const attachment = new AttachmentBuilder(image, { name: `movies-${currentPage}.png` });

      const highlightedTitles = titles.map((title) =>
        query ? title.replace(new RegExp(query, 'gi'), `**${query}**`) : title
      );

      const footer = `${store.searchResults} Ergebnisse ${query ? `für ${query}` : ''} gefunden.\nSeite ${
        currentPage + 1
      } von ${store.maxPages}`;

      const embed = new EmbedBuilder()
        .setColor('#e4a011')
        .setTitle('Verfügbare Filme 🎞️')
        .setDescription(highlightedTitles.join('\n'))
        .setFooter({ text: footer, iconURL: interaction.user.displayAvatarURL() })
        .setImage(`attachment://movies-${currentPage}.png`);

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
