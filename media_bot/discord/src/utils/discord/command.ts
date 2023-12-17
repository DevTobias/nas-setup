import { CommandInteraction, SlashCommandBuilder } from 'discord.js';

import { MediaClient } from '$utils/discord/client';

export interface Command {
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  run: (client: MediaClient, interaction: CommandInteraction) => Promise<unknown>;
}
