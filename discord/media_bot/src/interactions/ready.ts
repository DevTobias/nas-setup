import { Client, Events } from 'discord.js';

import { commands } from '$commands/_commands';

export const ready = async (client: Client) => {
  client.once(Events.ClientReady, async (readyClient) => {
    await readyClient.application.commands.set(commands);
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  });
};
