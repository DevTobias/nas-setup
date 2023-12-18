import { Writable } from 'stream';

import { UdpClient } from '$stream';

export class VideoStream extends Writable {
  public udb: () => UdpClient | undefined;

  public count: number;

  public sleepTime: number;

  public startTime?: number;

  public onWrite: (time: number) => void;

  private _paused: boolean;

  private _frameBuffer: Buffer[];

  constructor(udb: () => UdpClient | undefined, fps: number, onWrite: (time: number) => void) {
    super();

    this.udb = udb;
    this.count = 0;
    this.sleepTime = 1000 / fps;
    this.onWrite = onWrite;

    this._frameBuffer = [];
    this._paused = false;
  }

  public setSleepTime(time: number) {
    this.sleepTime = time;
  }

  public get stillFramesRemaining() {
    return this._frameBuffer.length !== 0;
  }

  public pause() {
    this._paused = true;
  }

  public resume() {
    this._paused = false;
  }

  _write(frame: Buffer, _: BufferEncoding, callback: (error?: Error | null) => void) {
    this.count += 1;
    if (!this.startTime) this.startTime = Date.now();

    this._frameBuffer.push(frame);

    if (!this._paused) this.udb()?.sendVideoFrame(this._frameBuffer.shift() ?? frame);

    const next = (this.count + 1) * this.sleepTime - (Date.now() - this.startTime);
    if (!this._paused) this.onWrite(next);
    setTimeout(() => callback(), next);
  }
}
