import { Command, UdpClient, streamLivestreamVideo } from '$stream';

type PlayerConfig = {
  includeAudio: boolean;
  fps: number;
  hardwareAcceleration: boolean;
};

export class VideoPlayer {
  private url: string;

  private options: PlayerConfig;

  private command: Command | undefined;

  private currentPlaytime: number;

  constructor(url: string, options: PlayerConfig) {
    this.currentPlaytime = 0;

    this.url = url;
    this.options = options;
  }

  play = async (udp: UdpClient) => {
    udp.mediaConnection.setSpeaking(true);
    udp.mediaConnection.setVideoStatus(true);

    const streamCallback = (_: string, operation: Command | undefined) => {
      this.command = operation;
    };

    try {
      await streamLivestreamVideo(this.url, udp, {
        includeAudio: this.options.includeAudio,
        fps: this.options.fps,
        hardwareAcceleration: this.options.hardwareAcceleration,
        onEvent: streamCallback,
        onProgress: (time) => (this.currentPlaytime += time),
      });
    } catch (e) {
      console.log(e);
    } finally {
      udp.mediaConnection.setSpeaking(false);
      udp.mediaConnection.setVideoStatus(false);
    }

    this.command?.kill('SIGINT');
  };

  pause = (udp: UdpClient) => {
    udp.mediaConnection.setSpeaking(false);
    udp.mediaConnection.setVideoStatus(false);

    this.command?.kill('SIGSTOP');
  };

  resume = (udp: UdpClient) => {
    udp.mediaConnection.setSpeaking(true);
    udp.mediaConnection.setVideoStatus(true);

    this.command?.kill('SIGCONT');
  };
}
