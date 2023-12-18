import WebSocket from 'ws';

import { UdpClient } from '$helper/Streamer/client/UdpClient';
import { VoiceOpCodes } from '$helper/Streamer/codes/VoiceOpCodes';

type VoiceConnectionStatus = {
  hasSession: boolean;
  hasToken: boolean;
  started: boolean;
  resuming: boolean;
};

type WSData = {
  ssrc: number;
  ip: string;
  port: number;
  modes: string[];
  secret_key: number;
};

type StreamOptions = {
  maxBitrateKbps: number;
  fps: number;
  width: number;
  height: number;
};

export abstract class BaseMediaConnection {
  private interval!: NodeJS.Timeout;

  public udp: UdpClient;

  public guildId: string;

  public channelId: string;

  public botId: string;

  public ws!: WebSocket;

  public ready: (udp: UdpClient) => void;

  public status: VoiceConnectionStatus;

  public server!: string;

  public token!: string;

  public session_id!: string;

  public self_ip!: string;

  public self_port!: number;

  public address!: string;

  public port!: number;

  public ssrc!: number;

  public videoSsrc!: number;

  public rtxSsrc!: number;

  public modes!: string[];

  public secretkey!: Uint8Array;

  public streamOptions: StreamOptions;

  constructor(
    guildId: string,
    botId: string,
    channelId: string,
    callback: (udp: UdpClient) => void,
    options: StreamOptions
  ) {
    this.status = {
      hasSession: false,
      hasToken: false,
      started: false,
      resuming: false,
    };

    this.udp = new UdpClient(this, options.fps);

    this.guildId = guildId;
    this.channelId = channelId;
    this.botId = botId;
    this.ready = callback;

    this.streamOptions = options;
  }

  public abstract get serverId(): string | undefined;

  stop(): void {
    clearInterval(this.interval);
    this.status.started = false;

    this.ws?.close();
    this.udp?.stop();
  }

  setSession(session_id: string): void {
    this.session_id = session_id;

    this.status.hasSession = true;
    this.start();
  }

  setTokens(server: string, token: string): void {
    this.token = token;
    this.server = server;

    this.status.hasToken = true;
    this.start();
  }

  start(): void {
    if (this.status.hasSession && this.status.hasToken) {
      if (this.status.started) return;
      this.status.started = true;

      this.ws = new WebSocket(`wss://${this.server}/?v=7`, {
        followRedirects: true,
      });

      this.ws.on('open', () => {
        if (this.status.resuming) {
          this.status.resuming = false;
          this.resume();
        } else {
          this.identify();
        }
      });

      this.ws.on('error', (err: Error) => {
        console.error(err);
      });

      this.ws.on('close', (code: number) => {
        const wasStarted = this.status.started;

        this.status.started = false;
        this.udp.ready = false;

        const canResume = code === 4_015 || code < 4_000;

        if (canResume && wasStarted) {
          this.status.resuming = true;
          this.start();
        }
      });

      this.setupEvents();
    }
  }

  handleReady(d: WSData): void {
    this.ssrc = d.ssrc;
    this.address = d.ip;
    this.port = d.port;
    this.modes = d.modes;
    this.videoSsrc = this.ssrc + 1;
    this.rtxSsrc = this.ssrc + 2;
  }

  handleSession(d: WSData): void {
    this.secretkey = new Uint8Array(d.secret_key);

    this.ready(this.udp);
    this.udp.ready = true;
  }

  setupEvents(): void {
    this.ws?.on('message', (data: string) => {
      const { op, d } = JSON.parse(data);

      if (op === VoiceOpCodes.READY) {
        this.handleReady(d);
        this.sendVoice();
        this.setVideoStatus(false);
      } else if (op >= 4000) {
        console.error(`Error ${this.constructor.name} connection`, d);
      } else if (op === VoiceOpCodes.HELLO) {
        this.setupHeartbeat(d.heartbeat_interval);
      } else if (op === VoiceOpCodes.SELECT_PROTOCOL_ACK) {
        this.handleSession(d);
      } else if (op === VoiceOpCodes.RESUMED) {
        this.status.started = true;
        this.udp.ready = true;
      }
    });
  }

  setupHeartbeat(interval: number): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(() => {
      this.sendOpcode(VoiceOpCodes.HEARTBEAT, 42069);
    }, interval);
  }

  sendOpcode(code: number, data: unknown): void {
    this.ws?.send(JSON.stringify({ op: code, d: data }));
  }

  identify(): void {
    this.sendOpcode(VoiceOpCodes.IDENTIFY, {
      server_id: this.serverId,
      user_id: this.botId,
      session_id: this.session_id,
      token: this.token,
      video: true,
      streams: [{ type: 'screen', rid: '100', quality: 100 }],
    });
  }

  resume(): void {
    this.sendOpcode(VoiceOpCodes.RESUME, {
      server_id: this.serverId,
      session_id: this.session_id,
      token: this.token,
    });
  }

  setProtocols(): void {
    this.sendOpcode(VoiceOpCodes.SELECT_PROTOCOL, {
      protocol: 'udp',
      codecs: [
        { name: 'opus', type: 'audio', priority: 1000, payload_type: 120 },
        {
          name: 'H264',
          type: 'video',
          priority: 1000,
          payload_type: 101,
          rtx_payload_type: 102,
          encode: true,
          decode: true,
        },
      ],
      data: {
        address: this.self_ip,
        port: this.self_port,
        mode: 'xsalsa20_poly1305_lite',
      },
    });
  }

  public setVideoStatus(bool: boolean): void {
    this.sendOpcode(VoiceOpCodes.VIDEO, {
      audio_ssrc: this.ssrc,
      video_ssrc: bool ? this.videoSsrc : 0,
      rtx_ssrc: bool ? this.rtxSsrc : 0,
      streams: [
        {
          type: 'video',
          rid: '100',
          ssrc: bool ? this.videoSsrc : 0,
          active: true,
          quality: 100,
          rtx_ssrc: bool ? this.rtxSsrc : 0,
          max_bitrate: this.streamOptions.maxBitrateKbps * 1000,
          max_framerate: this.streamOptions.fps,
          max_resolution: {
            type: 'fixed',
            width: this.streamOptions.width,
            height: this.streamOptions.height,
          },
        },
      ],
    });
  }

  public setSpeaking(speaking: boolean): void {
    this.sendOpcode(VoiceOpCodes.SPEAKING, {
      delay: 0,
      speaking: speaking ? 1 : 0,
      ssrc: this.ssrc,
    });
  }

  public sendVoice(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.udp.createUdp().then(() => resolve());
    });
  }
}
