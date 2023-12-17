import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const createMediaControlButtons = () => {
  const pause = new ButtonBuilder({ custom_id: 'pause', emoji: '⏸️', label: ' Pause', style: ButtonStyle.Secondary });
  const stop = new ButtonBuilder({ custom_id: 'stop', emoji: '⏹️', label: ' Stopp', style: ButtonStyle.Secondary });
  const actions = new ActionRowBuilder().addComponents(pause, stop);
  return { actions, pause, stop };
};
