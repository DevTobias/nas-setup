import { Writable } from 'stream';

import { UdpClient } from '$stream/Streamer/client/UdpClient';

export class AudioStream extends Writable {
  public udp: UdpClient;

  public count: number;

  public sleepTime: number;

  public startTime?: number;

  private _paused: boolean;

  private _chunkBuffer: Buffer[];

  constructor(udp: UdpClient) {
    super();

    this.udp = udp;
    this.count = 0;
    this.sleepTime = 20;

    this._chunkBuffer = [];
    this._paused = false;
  }

  public get stillFramesRemaining() {
    return this._chunkBuffer.length !== 0;
  }

  public pause() {
    this._paused = true;
  }

  public resume() {
    this._paused = false;
  }

  _write(chunk: Buffer, _: BufferEncoding, callback: (error?: Error | null) => void) {
    this.count += 1;
    if (!this.startTime) this.startTime = Date.now();

    this._chunkBuffer.push(chunk);
    if (!this._paused) this.udp.sendAudioFrame(this._chunkBuffer.shift() ?? chunk);

    const next = (this.count + 1) * this.sleepTime - (Date.now() - this.startTime);
    setTimeout(() => callback(), next);
  }
}
