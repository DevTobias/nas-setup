import { CommandInteraction, ComponentType, GuildMember } from 'discord.js';
import { WebSocket } from 'ws';

import { createEpisodeEmbed } from '$commands/media/stream/helper/createEpisodeEmbed';
import { MediaControlButtons } from '$commands/media/stream/helper/createMediaControlButtons';
import { TvEpisode, TvSeason, TvShow } from '$features/media/TvShowStore';
import { parsePayload, send } from '$utils/ws';

export const handleEpisodeRequest = async (
  interaction: CommandInteraction,
  socket: WebSocket,
  { actions, pauseBtn, stopBtn, leaveBtn, restartBtn }: MediaControlButtons,
  tv: TvShow,
  season: TvSeason,
  episode: TvEpisode,
  startTime?: string
) => {
  const tvEmbed = createEpisodeEmbed(episode, interaction.user, {
    seasonNumber: season.season_number,
    fallbackDescription: episode.overview,
    fallbackBanner: tv.fan_arts?.tvthumb ?? tv.backdrop_path,
  });

  const channelId = interaction.inGuild() ? (interaction.member as GuildMember).voice.channelId : null;
  if (!channelId) return interaction.editReply('You must be in a voice channel to start a stream ❌');

  const startPayload = {
    mediaPath: episode.file,
    channelId,
    guildId: interaction.guildId!,
    type: 'tvshow',
    startTime,
  };

  send(socket, { event: 'start', data: startPayload });

  pauseBtn.setDisabled(false);
  stopBtn.setDisabled(false);
  leaveBtn.setDisabled(false);
  restartBtn.setDisabled(false);

  const response = await interaction.editReply({ embeds: [tvEmbed], components: [actions as never] });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: episode.runtime! * 60 * 1000 + 10000,
  });

  collector.on('collect', async (event) => {
    await event.deferUpdate();

    if (event.customId === 'stop') send(socket, { event: 'stop' });
    if (event.customId === 'pause') send(socket, { event: 'pause' });
    if (event.customId === 'resume') send(socket, { event: 'resume' });
    if (event.customId === 'leave') send(socket, { event: 'leave' });
    if (event.customId === 'restart') {
      send(socket, { event: 'restart', data: startPayload });
      pauseBtn.setDisabled(false);
      stopBtn.setDisabled(false);
    }
  });

  socket.on('message', async (data) => {
    let finished = false;
    let progressInMs = 0;
    let components = [actions];

    const payload = parsePayload(data);

    if (!payload.succeeded) {
      return interaction.followUp({ content: `Aktion konnte nicht ausgeführt werden. ❌`, ephemeral: true });
    }

    if (payload.event === 'progress') {
      progressInMs = parseInt(payload.data, 10);
    }

    if (payload.event === 'stop') {
      pauseBtn.setDisabled(true);
      stopBtn.setDisabled(true);
    }

    if (payload.event === 'restart') {
      pauseBtn.setDisabled(false);
      stopBtn.setDisabled(false);
    }

    if (payload.event === 'pause') {
      pauseBtn.setLabel('Fortsetzen').setEmoji('▶️').setDisabled(false).setCustomId('resume');
    }

    if (payload.event === 'resume') {
      pauseBtn.setLabel('Pausieren').setEmoji('⏸️').setDisabled(false).setCustomId('pause');
    }

    if (payload.event === 'start' || payload.event === 'restart' || payload.event === 'leave') {
      components = [];
      finished = true;
      collector.stop();
      socket.close();
    }

    const progressEmbed = createEpisodeEmbed(episode, interaction.user, {
      seasonNumber: season.season_number,
      fallbackDescription: episode.overview,
      fallbackBanner: tv.fan_arts?.tvthumb ?? tv.backdrop_path,
      progress: Math.floor(progressInMs / 1000 / 60),
      finished,
    });

    await interaction.editReply({ embeds: [progressEmbed], components });
  });
};
