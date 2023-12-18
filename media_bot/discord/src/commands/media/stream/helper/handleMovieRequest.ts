import { CommandInteraction, ComponentType, GuildMember } from 'discord.js';
import { WebSocket } from 'ws';

import { createMediaControlButtons } from '$features/media/discord/createMediaControlButtons';
import { createMovieEmbed } from '$features/media/discord/createMovieEmbed';
import { Movie } from '$features/media/MovieStore';

export const handleMovieRequest = async (
  interaction: CommandInteraction,
  socket: WebSocket,
  { actions }: ReturnType<typeof createMediaControlButtons>,
  movie: Movie
) => {
  const movieEmbed = createMovieEmbed(movie, interaction.user);

  const channelId = interaction.inGuild() ? (interaction.member as GuildMember).voice.channelId : null;

  if (!channelId) {
    return interaction.editReply('You must be in a voice channel to start a stream ❌');
  }

  socket.send(
    JSON.stringify({
      event: 'start',
      data: { mediaPath: movie.file, channelId, guildId: interaction.guildId!, type: 'movie' },
    })
  );

  const response = await interaction.editReply({ embeds: [movieEmbed], components: [actions as never] });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: movie.runtime * 60 * 1000 + 10000,
  });

  collector.on('collect', async (event) => {
    if (event.customId === 'stop') {
      socket.send(
        JSON.stringify({
          event: 'stop',
          data: { mediaPath: movie.file, channelId, guildId: interaction.guildId!, type: 'movie' },
        })
      );
    }

    await event.deferUpdate();
  });
};
