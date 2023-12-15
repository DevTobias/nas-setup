import { Client, Events } from 'discord.js';

export const ready = async (client: Client) => {
  client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  });
};
