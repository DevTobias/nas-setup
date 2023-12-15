import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

import { MovieStore } from '$features/movies/MovieStore';
import { Command } from '$utils/discord/command';

const store = new MovieStore();

export const Movies: Command = {
  name: 'movies',
  description: 'Returns all available movies to stream.',
  run: async (_, interaction) => {
    let currentPage = 0;

    await interaction.deferReply();

    const enableNext = currentPage !== store.maxPages - 1;
    const enablePrev = currentPage !== 0;
    const style = ButtonStyle.Secondary;

    const next = new ButtonBuilder({ custom_id: 'next', emoji: '➡️', style, disabled: enableNext });
    const previous = new ButtonBuilder({ custom_id: 'previous', emoji: '⬅️', style, disabled: enablePrev });

    const actions = new ActionRowBuilder().addComponents(previous, next);

    const sendImage = async () => {
      const [titles, image] = await store.getMovies(currentPage);
      const attachment = new AttachmentBuilder(image, { name: `movies-${currentPage}.png` });
      const embed = new EmbedBuilder()
        .setColor('#e4a011')
        .setTitle(`Movie Titles Page ${currentPage + 1} / ${store.maxPages}`)
        .setDescription(titles.map((title) => `- ${title}`).join('\n'))
        .setImage(`attachment://movies-${currentPage}.png`);

      return interaction.editReply({ files: [attachment], components: [actions as never], embeds: [embed] });
    };

    const response = await sendImage();
    const collector = response.createMessageComponentCollector({ time: 3_600_000 });

    collector.on('collect', async (confirmation) => {
      if (confirmation.customId === 'next') currentPage += 1;
      else if (confirmation.customId === 'previous') currentPage -= 1;

      next.setDisabled(currentPage === store.maxPages - 1);
      previous.setDisabled(currentPage === 0);

      await confirmation.deferUpdate();
      await sendImage();
    });
  },
};
