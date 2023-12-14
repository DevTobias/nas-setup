import { Client, GatewayIntentBits } from 'discord.js';

import { config } from '$config';
import { interactions } from '$interactions/_interactions';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
interactions.forEach((interaction) => interaction(client));
client.login(config.BOT_TOKEN);
