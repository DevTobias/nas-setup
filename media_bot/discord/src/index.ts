import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';

import { commands } from '$commands/_commands';
import { config } from '$config';
import { interactions } from '$interactions/_interactions';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
interactions.forEach((interaction) => interaction(client));

const main = async () => {
  const rest = new REST().setToken(config.BOT_TOKEN);
  const slashCommands = commands.map((c) => c.data.toJSON());

  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
    await rest.put(Routes.applicationCommands(config.BOT_CLIENT_ID), { body: slashCommands });
    console.log('Successfully registered application commands.');

    client.login(config.BOT_TOKEN);
  } catch (error) {
    console.error(error);
  }
};

main();
