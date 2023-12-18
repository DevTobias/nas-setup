import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const createMediaControlButtons = () => {
  const restartBtn = new ButtonBuilder({
    custom_id: 'restart',
    emoji: '🔄',
    label: ' Neustarten',
    style: ButtonStyle.Secondary,
    disabled: false,
  });

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

  const actions = new ActionRowBuilder<ButtonBuilder>().addComponents(restartBtn, pauseBtn, stopBtn);
  return { actions, restartBtn, pauseBtn, stopBtn };
};

export type MediaControlButtons = ReturnType<typeof createMediaControlButtons>;
