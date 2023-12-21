import { SlashCommandBuilder } from 'discord.js';

import { StreamHandler } from '$commands/media/stream/helper/StreamHandler';
import { Command } from '$utils/discord/command';

export const Stream: Command = {
  data: new SlashCommandBuilder()
    .setName('stream')
    .setDescription('Startet den Stream für ein ausgewähltes Medium.')
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('Entscheidet ob eine Serie oder ein Film abgespielt werden soll.')
        .setRequired(true)
        .addChoices({ name: 'Serie', value: 'tv_show' }, { name: 'Film', value: 'movie' })
    )
    .addStringOption((option) => option.setName('name').setDescription('Name der Serie oder des Films.').setRequired(true))
    .addStringOption((option) => option.setName('start').setDescription('Start des Mediums im Format [[hh:]mm:]ss[.xxx].')),
  run: async (client, interaction) => {
    const msg = await interaction.deferReply({ fetchReply: true });

    const type = interaction.options.get('type')!.value!.toString() as 'tv_show' | 'movie';
    const name = interaction.options.get('name')!.value!.toString();
    const startTime = interaction.options.get('start')?.value?.toString();

    const handler = new StreamHandler(client, interaction, msg);
    await handler.initialize();
    handler.stream({ type, name, startTime });
  },
};
