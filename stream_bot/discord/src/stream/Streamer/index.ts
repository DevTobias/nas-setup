import { Client } from 'discord.js-selfbot-v13';

import { StreamConnection } from '$stream/Streamer/client/connections/StreamConnection';
import { VoiceConnection } from '$stream/Streamer/client/connections/VoiceConnection';
import { UdpClient } from '$stream/Streamer/client/UdpClient';
import { GatewayOpCodes } from '$stream/Streamer/codes/GatewayOpCodes';

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

export class Streamer {
  private _voiceConnection?: VoiceConnection;

  private _client: Client;

  private _options: StreamOptions;

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

  public get voiceConnection(): VoiceConnection | undefined {
    return this._voiceConnection;
  }

  public sendOpcode(code: number, data: Partial<Data>): void {
    // @ts-ignore
    this.client.ws.broadcast({
      op: code,
      d: data,
    });
  }

  public joinVoice(guild_id: string, channel_id: string): Promise<UdpClient> {
    return new Promise<UdpClient>((resolve) => {
      this._voiceConnection = new VoiceConnection(
        guild_id,
        this.client.user!.id,
        channel_id,
        (voiceUdp) => {
          resolve(voiceUdp);
        },
        this._options
      );

      this.signalVideo(guild_id, channel_id, false);
    });
  }

  public createStream(): Promise<UdpClient> {
    return new Promise<UdpClient>((resolve, reject) => {
      if (!this.voiceConnection) reject(new Error('cannot start stream without first joining voice channel'));

      this.signalStream(this.voiceConnection!.guildId, this.voiceConnection!.channelId);

      this.voiceConnection!.streamConnection = new StreamConnection(
        this.voiceConnection!.guildId,
        this.client.user!.id,
        this.voiceConnection!.channelId,
        (voiceUdp) => {
          resolve(voiceUdp);
        },
        this._options
      );
    });
  }

  public stopStream(): void {
    try {
      const stream = this.voiceConnection?.streamConnection;
      if (!stream) return;
      stream.stop();
      this.signalStopStream(stream.guildId, stream.channelId);
      this.voiceConnection.streamConnection = undefined;
    } catch (e) {
      // If this fails, the stream is already stopped
    }
  }

  public leaveVoice(): void {
    this.voiceConnection?.stop();
    this.signalLeaveVoice();
    this._voiceConnection = undefined;
  }

  public signalVideo(guild_id: string, channel_id: string, video_enabled: boolean): void {
    this.sendOpcode(GatewayOpCodes.VOICE_STATE_UPDATE, {
      guild_id,
      channel_id,
      self_mute: false,
      self_deaf: true,
      self_video: video_enabled,
    });
  }

  public signalStream(guild_id: string, channel_id: string): void {
    this.sendOpcode(GatewayOpCodes.STREAM_CREATE, {
      type: 'guild',
      guild_id,
      channel_id,
      preferred_region: undefined,
    });

    this.sendOpcode(GatewayOpCodes.STREAM_SET_PAUSED, {
      stream_key: `guild:${guild_id}:${channel_id}:${this.client.user!.id}`,
      paused: false,
    });
  }

  public signalStopStream(guild_id: string, channel_id: string): void {
    this.sendOpcode(GatewayOpCodes.STREAM_DELETE, {
      stream_key: `guild:${guild_id}:${channel_id}:${this.client.user!.id}`,
    });
  }

  public signalLeaveVoice(): void {
    this.sendOpcode(GatewayOpCodes.VOICE_STATE_UPDATE, {
      guild_id: undefined,
      channel_id: undefined,
      self_mute: true,
      self_deaf: false,
      self_video: false,
    });
  }

  private handleGatewayEvent(event: string, data: Partial<Data>): void {
    switch (event) {
      case 'VOICE_STATE_UPDATE': {
        if (data.user_id === this.client.user!.id) {
          this.voiceConnection?.setSession(data.session_id!);
        }
        break;
      }
      case 'VOICE_SERVER_UPDATE': {
        if (data.guild_id !== this.voiceConnection?.guildId) return;
        this.voiceConnection?.setTokens(data.endpoint!, data.token!);
        break;
      }
      case 'STREAM_CREATE': {
        const [, guildId, , userId] = data.stream_key!.split(':');

        if (this.voiceConnection?.guildId !== guildId) return;

        if (userId === this.client.user!.id && this.voiceConnection.streamConnection) {
          this.voiceConnection.streamConnection.serverId = data.rtc_server_id!;
          this.voiceConnection.streamConnection.streamKey = data.stream_key!;
          this.voiceConnection.streamConnection.setSession(this.voiceConnection.session_id);
        }
        break;
      }
      case 'STREAM_SERVER_UPDATE': {
        const [, guildId, , userId] = data.stream_key!.split(':');

        if (this.voiceConnection?.guildId !== guildId) return;

        if (userId === this.client.user!.id) {
          this.voiceConnection.streamConnection!.setTokens(data.endpoint!, data.token!);
        }
        break;
      }
      default:
        break;
    }
  }
}
