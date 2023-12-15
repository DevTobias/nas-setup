import { EmbedBuilder } from 'discord.js';

export const createMediaEmbed = (description: string, footer: string) => {
  return new EmbedBuilder()
    .setColor('#e4a011')
    .setTitle('🎞️ Verfügbare Medieninhalte')
    .setDescription(description)
    .setFooter({ text: footer })
    .setImage(`attachment://media-overview.png`);
};
