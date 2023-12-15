import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const createActionButtons = () => {
  const next = new ButtonBuilder({ custom_id: 'next', emoji: '➡️', style: ButtonStyle.Secondary });
  const previous = new ButtonBuilder({ custom_id: 'previous', emoji: '⬅️', style: ButtonStyle.Secondary });
  const actions = new ActionRowBuilder().addComponents(previous, next);
  return [actions, next, previous] as const;
};
