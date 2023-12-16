import { Client, CommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface Command {
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  run: (client: Client, interaction: CommandInteraction) => Promise<unknown>;
}
