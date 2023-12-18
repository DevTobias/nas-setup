import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const createMediaControlButtons = () => {
  const pauseBtn = new ButtonBuilder({
    custom_id: 'pause',
    emoji: '⏸️',
    label: ' Pausieren',
    style: ButtonStyle.Secondary,
    disabled: true,
  });

  const stopBtn = new ButtonBuilder({
    custom_id: 'stop',
    emoji: '⏹️',
    label: ' Stoppen',
    style: ButtonStyle.Secondary,
    disabled: true,
  });

  const actions = new ActionRowBuilder().addComponents(pauseBtn, stopBtn);
  return { actions, pauseBtn, stopBtn };
};
