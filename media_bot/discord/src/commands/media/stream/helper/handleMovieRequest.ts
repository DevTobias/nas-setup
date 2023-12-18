import { CommandInteraction, ComponentType, GuildMember } from 'discord.js';
import { WebSocket } from 'ws';

import { createMediaControlButtons } from '$features/media/discord/createMediaControlButtons';
import { createMovieEmbed } from '$features/media/discord/createMovieEmbed';
import { Movie } from '$features/media/MovieStore';
import { parsePayload, send } from '$utils/ws';

export const handleMovieRequest = async (
  interaction: CommandInteraction,
  socket: WebSocket,
  { actions, pauseBtn, stopBtn }: ReturnType<typeof createMediaControlButtons>,
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

  pauseBtn.setDisabled(false);
  stopBtn.setDisabled(false);

  const response = await interaction.editReply({ embeds: [movieEmbed], components: [actions as never] });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: movie.runtime * 60 * 1000 + 10000,
  });

  collector.on('collect', async (event) => {
    await event.deferUpdate();

    if (event.customId === 'stop') send(socket, { event: 'stop' });
    if (event.customId === 'pause') send(socket, { event: 'pause' });
    if (event.customId === 'resume') send(socket, { event: 'resume' });
  });

  socket.on('message', async (data) => {
    const payload = parsePayload(data);

    if (payload.event === 'stop' && payload.succeeded) {
      pauseBtn.setDisabled(true);
      stopBtn.setDisabled(true);
      await interaction.editReply({ embeds: [movieEmbed], components: [actions as never] });
    }

    if (payload.event === 'pause' && payload.succeeded) {
      pauseBtn.setLabel('Fortsetzen').setEmoji('▶️').setDisabled(false).setCustomId('resume');
      await interaction.editReply({ embeds: [movieEmbed], components: [actions as never] });
    }

    if (payload.event === 'resume' && payload.succeeded) {
      pauseBtn.setLabel('Pausieren').setEmoji('⏸️').setDisabled(false).setCustomId('pause');
      await interaction.editReply({ embeds: [movieEmbed], components: [actions as never] });
    }

    if (payload.event === 'start' && !payload.succeeded) {
      await interaction.followUp({
        content: `Stream für \`${movie.title} (${movie.release_date.getFullYear()})\` konnte nicht gestartet werden ❌`,
        ephemeral: true,
      });
    }

    if ((payload.event === 'stop' && payload.succeeded) || (payload.event === 'start' && payload.succeeded)) {
      await interaction.editReply({
        embeds: [movieEmbed.setTitle(`Stream für \`${movie.title} (${movie.release_date.getFullYear()})\` beendet`)],
      });
    }
  });
};
