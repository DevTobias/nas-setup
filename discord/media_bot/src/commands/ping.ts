import { Command } from '$commands/_command';

export const Ping: Command = {
  name: 'ping',
  description: 'Replies with Pong!',
  run: async (_, interaction) => {
    await interaction.reply('Pong!');
  },
};
