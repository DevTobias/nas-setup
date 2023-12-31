import { Client } from 'discord.js-selfbot-v13';

import { StreamConnection } from '$helper/Streamer/client/connections/StreamConnection';
import { VoiceConnection } from '$helper/Streamer/client/connections/VoiceConnection';
import { UdpClient } from '$helper/Streamer/client/UdpClient';
import { GatewayOpCodes } from '$helper/Streamer/codes/GatewayOpCodes';
import { streamLivestreamVideo } from '$helper/Streamer/streamLivestreamVideo';
import { AudioStream } from '$helper/Streamer/streamLivestreamVideo/streams/AudioStream';
import { VideoStream } from '$helper/Streamer/streamLivestreamVideo/streams/VideoStream';
import { Command } from '$helper/Streamer/types/command';
import { timeStringToSeconds } from '$helper/time';

interface Data {
  type: string;
  user_id: string;
  guild_id: string;
  channel_id: string;
  self_mute: boolean;
  self_deaf: boolean;
  self_video: boolean;
  preferred_region: string;
  stream_key: string;
  session_id: string;
  paused: boolean;
  endpoint: string;
  token: string;
  rtc_server_id: string;
}

type StreamOptions = {
  maxBitrateKbps: number;
  fps: number;
  width: number;
  height: number;
};

type PlayerConfig = {
  includeAudio: boolean;
  hardwareAcceleration: boolean;
  startTime?: string;
};

export class Streamer {
  private _voiceConnection?: VoiceConnection;

  private _client: Client;

  private _options: StreamOptions;

  private _udbClient?: UdpClient;

  private _command?: Command;

  private _currentPlaytime = 0;

  private _paused = false;

  private _audioStream: AudioStream | undefined;

  private _videoStream: VideoStream | undefined;

  private _onProgress: ((time: number) => void) | undefined;

  constructor(client: Client, options: StreamOptions) {
    this._client = client;

    this.client.on('raw', (packet: { t: string; d: Partial<Data> }) => {
      this.handleGatewayEvent(packet.t, packet.d);
    });

    this._options = options;
  }

  public get client(): Client {
    return this._client;
  }

  public joinVoice(guild_id: string, channel_id: string): Promise<UdpClient | undefined> {
    this.resetStream();

    if (this._voiceConnection) return Promise.resolve(this._udbClient);

    return new Promise<UdpClient>((resolve) => {
      this._voiceConnection = new VoiceConnection(
        guild_id,
        this.client.user!.id,
        channel_id,
        (voiceUdp) => {
          this._udbClient = voiceUdp;
          resolve(voiceUdp);
        },
        this._options
      );

      this.sendOpcode(GatewayOpCodes.VOICE_STATE_UPDATE, {
        guild_id,
        channel_id,
        self_mute: false,
        self_deaf: true,
        self_video: false,
      });
    });
  }

  public createStream(): Promise<UdpClient> {
    return new Promise<UdpClient>((resolve, reject) => {
      if (!this._voiceConnection) reject(new Error('cannot start stream without first joining voice channel'));

      this.sendOpcode(GatewayOpCodes.STREAM_CREATE, {
        type: 'guild',
        guild_id: this._voiceConnection!.guildId,
        channel_id: this._voiceConnection!.channelId,
        preferred_region: undefined,
      });

      this.sendOpcode(GatewayOpCodes.STREAM_SET_PAUSED, {
        stream_key: `guild:${this._voiceConnection!.guildId}:${this._voiceConnection!.channelId}:${this.client.user!.id}`,
        paused: false,
      });

      this._voiceConnection!.streamConnection = new StreamConnection(
        this._voiceConnection!.guildId,
        this.client.user!.id,
        this._voiceConnection!.channelId,
        (voiceUdp) => {
          this._udbClient = voiceUdp;
          resolve(voiceUdp);
        },
        this._options
      );
    });
  }

  public onProgress(callback: (time: number) => void): void {
    this._onProgress = callback;
  }

  public async startStream(path: string, options: PlayerConfig) {
    if (!this._udbClient) {
      throw new Error('cannot start video without creating a stream first');
    }

    this._udbClient.mediaConnection.setSpeaking(true);
    this._udbClient.mediaConnection.setVideoStatus(true);

    const streamCallback = (_: string, operation: Command | undefined) => {
      this._command = operation;
    };

    try {
      if (options.startTime) {
        this._currentPlaytime = timeStringToSeconds(options.startTime) * 1000;
        this._onProgress?.(this._currentPlaytime);
      }

      const [streamPromise, videoStream, audioStream] = streamLivestreamVideo(path, () => this._udbClient, {
        startTime: options.startTime,
        includeAudio: options.includeAudio,
        fps: this._options.fps,
        hardwareAcceleration: options.hardwareAcceleration,
        onEvent: streamCallback,
        onProgress: (time) => {
          this._currentPlaytime += time;
          this._onProgress?.(this._currentPlaytime);
        },
      });

      this._audioStream = audioStream;
      this._videoStream = videoStream;
      await streamPromise;
    } finally {
      this._udbClient?.mediaConnection.setSpeaking(false);
      this._udbClient?.mediaConnection.setVideoStatus(false);
      this.resetStream();
    }
  }

  public stopStream(soft = false): void {
    try {
      const stream = this._voiceConnection?.streamConnection;
      if (!stream || !this._voiceConnection) return;
      stream.stop();
      this.sendOpcode(GatewayOpCodes.STREAM_DELETE, {
        stream_key: `guild:${stream.guildId}:${stream.channelId}:${this.client.user!.id}`,
      });
    } finally {
      if (this._voiceConnection?.streamConnection) this._voiceConnection.streamConnection = undefined;
      if (!soft) this.resetStream();
      this._udbClient = undefined;
    }
  }

  public pauseStream(): void {
    if (!this._udbClient || this._paused) return;

    this._paused = true;
    this._audioStream?.pause();
    this._videoStream?.pause();

    this.stopStream(true);
  }

  public resumeStream(): void {
    if (!this._paused) return;

    this.createStream().then(() => {
      this._udbClient?.mediaConnection.setSpeaking(true);
      this._udbClient?.mediaConnection.setVideoStatus(true);
      this._paused = false;
      this._audioStream?.resume();
      this._videoStream?.resume();
    });
  }

  public leaveVoice(): void {
    try {
      this._voiceConnection?.stop();
      this.sendOpcode(GatewayOpCodes.VOICE_STATE_UPDATE, {
        guild_id: undefined,
        channel_id: undefined,
        self_mute: true,
        self_deaf: false,
        self_video: false,
      });
    } finally {
      this._voiceConnection = undefined;
      this.resetStream();
    }
  }

  public resetStream(): void {
    this._command?.kill('SIGINT');
    this._command = undefined;
    this._udbClient = undefined;
    this._currentPlaytime = 0;
    this._paused = false;
  }

  private sendOpcode(code: number, data: Partial<Data>): void {
    // @ts-ignore
    this.client.ws.broadcast({ op: code, d: data });
  }

  private handleGatewayEvent(event: string, data: Partial<Data>): void {
    switch (event) {
      case 'VOICE_STATE_UPDATE': {
        if (data.user_id === this.client.user!.id) {
          this._voiceConnection?.setSession(data.session_id!);
        }
        break;
      }
      case 'VOICE_SERVER_UPDATE': {
        if (data.guild_id !== this._voiceConnection?.guildId) return;
        this._voiceConnection?.setTokens(data.endpoint!, data.token!);
        break;
      }
      case 'STREAM_CREATE': {
        const [, guildId, , userId] = data.stream_key!.split(':');

        if (this._voiceConnection?.guildId !== guildId) return;

        if (userId === this.client.user!.id && this._voiceConnection.streamConnection) {
          this._voiceConnection.streamConnection.serverId = data.rtc_server_id!;
          this._voiceConnection.streamConnection.streamKey = data.stream_key!;
          this._voiceConnection.streamConnection.setSession(this._voiceConnection.session_id);
        }
        break;
      }
      case 'STREAM_SERVER_UPDATE': {
        const [, guildId, , userId] = data.stream_key!.split(':');

        if (this._voiceConnection?.guildId !== guildId) return;

        if (userId === this.client.user!.id) {
          this._voiceConnection.streamConnection!.setTokens(data.endpoint!, data.token!);
        }
        break;
      }
      default:
        break;
    }
  }
}
