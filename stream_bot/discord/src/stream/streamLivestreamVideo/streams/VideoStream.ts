import { Writable } from 'stream';

import { UdpClient } from '$stream/Streamer/client/UdpClient';

export class VideoStream extends Writable {
  public udp: UdpClient;

  public count: number;

  public sleepTime: number;

  public startTime?: number;

  public onWrite: (time: number) => void;

  constructor(udp: UdpClient, fps: number, onWrite: (time: number) => void) {
    super();

    this.udp = udp;
    this.count = 0;
    this.sleepTime = 1000 / fps;
    this.onWrite = onWrite;
  }

  public setSleepTime(time: number) {
    this.sleepTime = time;
  }

  _write(frame: Buffer, _: BufferEncoding, callback: (error?: Error | null) => void) {
    this.count += 1;
    if (!this.startTime) this.startTime = Date.now();

    this.udp.sendVideoFrame(frame);

    const next = (this.count + 1) * this.sleepTime - (Date.now() - this.startTime);
    this.onWrite(next);
    setTimeout(() => callback(), next);
  }
}
