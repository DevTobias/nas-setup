import { BaseMediaPacketizer } from '$helper/Streamer/client/packetizer/BaseMediaPacketizer';
import { UdpClient } from '$helper/Streamer/client/UdpClient';

const timeIncrement = (48000 / 100) * 2;

export class AudioPacketizer extends BaseMediaPacketizer {
  constructor(connection: UdpClient) {
    super(connection, 0x78);
  }

  public override sendFrame(frame: Buffer): void {
    const packet = this.createPacket(frame);
    this.mediaUdp.sendPacket(packet);
    this.onFrameSent();
  }

  public createPacket(chunk: Buffer): Buffer {
    const header = this.makeRtpHeader(this.mediaUdp.mediaConnection.ssrc!);
    const nonceBuffer = this.mediaUdp.getNewNonceBuffer();
    return Buffer.concat([header, this.encryptData(chunk, nonceBuffer), nonceBuffer.subarray(0, 4)]);
  }

  public override onFrameSent(): void {
    this.incrementTimestamp(timeIncrement);
  }
}
