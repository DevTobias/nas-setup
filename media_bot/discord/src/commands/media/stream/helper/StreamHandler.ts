import { CacheType, CommandInteraction, ComponentType, EmbedBuilder, GuildMember, Message } from 'discord.js';
import { WebSocket } from 'ws';

import { createMediaControlButtons } from '$commands/media/stream/helper/createMediaControlButtons';
import { createSelectEpisodeActions } from '$commands/media/stream/helper/createSelectEpisodeActionts';
import { createSelectSeasonActions } from '$commands/media/stream/helper/createSelectSeasonActions';
import { createEpisodeEmbed } from '$commands/media/stream/helper/embeds/createEpisodeEmbed';
import { createMovieEmbed } from '$commands/media/stream/helper/embeds/createMovieEmbed';
import { createSelectEpisodeEmbed } from '$commands/media/stream/helper/embeds/createSelectEpisodeEmbed';
import { config } from '$config';
import { TvEpisode, TvSeason } from '$features/media/TvShowStore';
import { MediaClient } from '$utils/discord/client';
import { connectToWebSocket, parsePayload, send } from '$utils/ws';

type StreamOptions = {
  type: 'movie' | 'tv_show';
  name: string;
  startTime?: string | undefined;
};

export class StreamHandler {
  private mediaActions: ReturnType<typeof createMediaControlButtons>;

  private socket!: WebSocket;

  constructor(
    private client: MediaClient,
    private interaction: CommandInteraction<CacheType>,
    private msg: Message<boolean>
  ) {
    this.mediaActions = createMediaControlButtons();
  }

  initialize = async () => {
    this.socket = await connectToWebSocket(config.STREAMER_ENDPOINT);
  };

  public stream = async (options: StreamOptions) => {
    if (options.type === 'movie') return this.handleMovieRequest(options);
    if (options.type === 'tv_show') return this.handleEpisodeRequest(options);
  };

  get channelId() {
    return this.interaction.inGuild() ? (this.interaction.member as GuildMember).voice.channelId : null;
  }

  private handleMovieRequest = async (options: StreamOptions) => {
    if (!this.channelId) {
      return this.interaction.editReply('You must be in a voice channel to start a stream ❌');
    }

    const movie = this.client.movieStore.search(options.name);

    if (!movie) {
      return this.interaction.editReply({ content: `Der Film **${options.name}** konnte nicht gefunden werden` });
    }

    const initialEmbed = createMovieEmbed(movie.meta, this.interaction.user);
    return this.handleStream(movie.meta.file, movie.meta.runtime, initialEmbed, options, (progressInMs, finished) => {
      return createMovieEmbed(movie.meta, this.interaction.user, { progressInMs, finished });
    });
  };

  private handleEpisodeRequest = async (options: StreamOptions) => {
    if (!this.channelId) {
      return this.interaction.editReply('You must be in a voice channel to start a stream ❌');
    }

    const tv = this.client.tvShowStore.search(options.name);

    if (!tv) {
      return this.interaction.editReply({ content: `Die Serie **${options.name}** konnte nicht gefunden werden` });
    }

    const selectEmbed = createSelectEpisodeEmbed(tv.meta, this.interaction.user);
    const selectSeasonAction = createSelectSeasonActions(tv.meta);
    const seasonResponse = await this.interaction.editReply({ embeds: [selectEmbed], components: [selectSeasonAction] });

    const selectedSeason = await new Promise<TvSeason>((resolve) => {
      const seasonCollector = seasonResponse.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60_000,
      });

      seasonCollector.on('collect', async (selection) => {
        await selection.deferUpdate();
        const selectedSeasonNumber = Number(selection.values[0]);
        const season = tv.meta.seasons.find((s) => s.season_number === selectedSeasonNumber)!;
        seasonCollector.stop();
        resolve(season);
      });
    });

    const selectEpisodeActions = createSelectEpisodeActions(selectedSeason);
    const episodeResponse = await this.interaction.editReply({ embeds: [selectEmbed], components: [selectEpisodeActions] });

    const selectedEpisode = await new Promise<TvEpisode>((resolve) => {
      const episodeCollector = episodeResponse.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60_000,
      });

      episodeCollector.on('collect', async (selection) => {
        await selection.deferUpdate();
        const selectedEpisodeNumber = Number(selection.values[0]);
        const episode = selectedSeason.episodes.find((e) => e.episode_number === selectedEpisodeNumber)!;
        episodeCollector.stop();
        resolve(episode);
      });
    });

    const initialEmbed = createEpisodeEmbed(tv.meta, selectedSeason, selectedEpisode, this.interaction.user);

    return this.handleStream(
      selectedEpisode.file!,
      selectedEpisode.runtime!,
      initialEmbed,
      options,
      (progressInMs, finished) => {
        return createEpisodeEmbed(tv.meta, selectedSeason, selectedEpisode, this.interaction.user, {
          progressInMs,
          finished,
        });
      }
    );
  };

  private handleStream = async (
    url: string,
    runtime: number,
    initialEmbed: EmbedBuilder,
    options: StreamOptions,
    embedBuilder: (progress: number | undefined, finished: boolean) => EmbedBuilder
  ) => {
    const { actions, pauseBtn, stopBtn } = this.mediaActions;

    const startPayload = {
      mediaPath: url,
      channelId: this.channelId,
      guildId: this.interaction.guildId!,
      type: options.type,
      startTime: options.startTime,
    };

    send(this.socket, { event: 'start', data: startPayload });

    this.enableMediaControls();
    const response = await this.interaction.editReply({ embeds: [initialEmbed], components: [actions] });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: runtime * 60 * 1000 + 10000,
    });

    collector.on('collect', async (event) => {
      await event.deferUpdate();

      switch (event.customId) {
        case 'stop':
          return send(this.socket, { event: 'stop' });
        case 'pause':
          return send(this.socket, { event: 'pause' });
        case 'resume':
          return send(this.socket, { event: 'resume' });
        case 'leave':
          return send(this.socket, { event: 'leave' });
        case 'restart':
          send(this.socket, { event: 'restart', data: startPayload });
          return this.enableMediaControls();
        default:
      }
    });

    let progressInMs = 0;

    this.socket.on('message', async (data) => {
      let finished = false;
      let components = [actions];

      const { event, succeeded, data: payloadData } = parsePayload(data);
      if (!succeeded) return;

      if (event === 'progress') {
        progressInMs = parseInt(payloadData!, 10);
      }

      if (event === 'stop') {
        pauseBtn.setDisabled(true);
        stopBtn.setDisabled(true);
      }

      if (event === 'pause') {
        pauseBtn.setLabel('Fortsetzen').setEmoji('▶️').setDisabled(false).setCustomId('resume');
      }

      if (event === 'resume') {
        pauseBtn.setLabel('Pausieren').setEmoji('⏸️').setDisabled(false).setCustomId('pause');
      }

      if (event === 'start' || event === 'restart') {
        progressInMs = runtime * 60 * 1000;
      }

      if (event === 'start' || event === 'restart' || event === 'leave') {
        finished = true;
        components = [];
        collector.stop();
        this.socket.close();
      }

      const updatedEmbed = embedBuilder(progressInMs, finished);
      await this.msg.edit({ embeds: [updatedEmbed], components });
    });
  };

  private enableMediaControls = () => {
    const { pauseBtn, stopBtn, leaveBtn, restartBtn } = this.mediaActions;
    pauseBtn.setDisabled(false);
    stopBtn.setDisabled(false);
    leaveBtn.setDisabled(false);
    restartBtn.setDisabled(false);
  };
}
