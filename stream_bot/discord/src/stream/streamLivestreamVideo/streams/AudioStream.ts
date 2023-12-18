import { Writable } from 'stream';

import { UdpClient } from '$stream/Streamer/client/UdpClient';

export class AudioStream extends Writable {
  public udp: UdpClient;

  public count: number;

  public sleepTime: number;

  public startTime?: number;

  constructor(udp: UdpClient) {
    super();

    this.udp = udp;
    this.count = 0;
    this.sleepTime = 20;
  }

  _write(chunk: Buffer, _: BufferEncoding, callback: (error?: Error | null) => void) {
    this.count += 1;
    if (!this.startTime) this.startTime = Date.now();

    this.udp.sendAudioFrame(chunk);

    const next = (this.count + 1) * this.sleepTime - (Date.now() - this.startTime);
    setTimeout(() => callback(), next);
  }
}
