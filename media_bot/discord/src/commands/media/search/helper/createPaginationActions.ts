import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const createPaginationActions = () => {
  const nextBtn = new ButtonBuilder({ custom_id: 'next', emoji: '➡️', style: ButtonStyle.Secondary });
  const previousBtn = new ButtonBuilder({ custom_id: 'previous', emoji: '⬅️', style: ButtonStyle.Secondary });
  const paginationActions = new ActionRowBuilder<ButtonBuilder>().addComponents(previousBtn, nextBtn);
  return { paginationActions, nextBtn, previousBtn };
};
