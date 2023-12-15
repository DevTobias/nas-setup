import { Client, CommandInteraction, Events } from 'discord.js';

import { commands } from '$commands/_commands';

const handleSlashCommand = async (client: Client, interaction: CommandInteraction) => {
  const command = commands.find((c) => c.data.name === interaction.commandName);

  if (!command) {
    return interaction.followUp({ content: `No command matching ${interaction.commandName} was found.` });
  }

  try {
    await command.run(client, interaction);
  } catch (error) {
    console.error(error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
};

export const interactionCreate = (client: Client) => {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
      await handleSlashCommand(client, interaction);
    }
  });
};
