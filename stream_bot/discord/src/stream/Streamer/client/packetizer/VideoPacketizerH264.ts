import { BaseMediaPacketizer } from '$stream/Streamer/client/packetizer/BaseMediaPacketizer';
import { UdpClient } from '$stream/Streamer/client/UdpClient';

export class VideoPacketizerH264 extends BaseMediaPacketizer {
  private fps: number;

  constructor(connection: UdpClient, fps: number) {
    super(connection, 0x65, true);

    this.fps = fps;
  }

  public override sendFrame(frame: Buffer): void {
    const accessUnit = frame;

    const nalus: Buffer[] = [];

    let offset = 0;
    while (offset < accessUnit.length) {
      const naluSize = accessUnit.readUInt32BE(offset);
      offset += 4;
      const nalu = accessUnit.subarray(offset, offset + naluSize);
      nalus.push(nalu);
      offset += nalu.length;
    }

    let index = 0;
    for (const nalu of nalus) {
      const nal0 = nalu[0];
      const isLastNal = index === nalus.length - 1;
      if (nalu.length <= this.mtu) {
        const packetHeader = this.makeRtpHeader(this.mediaUdp.mediaConnection.videoSsrc!, isLastNal);
        const packetData = Buffer.concat([VideoPacketizerH264.createHeaderExtension(), nalu]);

        const nonceBuffer = this.mediaUdp.getNewNonceBuffer();
        this.mediaUdp.sendPacket(
          Buffer.concat([packetHeader, this.encryptData(packetData, nonceBuffer), nonceBuffer.subarray(0, 4)])
        );
      } else {
        const data = this.partitionDataMTUSizedChunks(nalu.subarray(1));

        for (let i = 0; i < data.length; i += 1) {
          const isFirstPacket = i === 0;
          const isFinalPacket = i === data.length - 1;

          const markerBit = isLastNal && isFinalPacket;

          const packetHeader = this.makeRtpHeader(this.mediaUdp.mediaConnection.videoSsrc!, markerBit);

          const packetData = VideoPacketizerH264.makeChunk(data[i], isFirstPacket, isFinalPacket, nal0);

          const nonceBuffer = this.mediaUdp.getNewNonceBuffer();
          this.mediaUdp.sendPacket(
            Buffer.concat([packetHeader, this.encryptData(packetData, nonceBuffer), nonceBuffer.subarray(0, 4)])
          );
        }
      }
      index += 1;
    }

    this.onFrameSent();
  }

  private static makeChunk(frameData: Buffer, isFirstPacket: boolean, isLastPacket: boolean, nal0: number): Buffer {
    const headerExtensionBuf = VideoPacketizerH264.createHeaderExtension();

    const fuPayloadHeader = Buffer.alloc(2);
    const nalType = nal0 & 0x1f;
    const fnri = nal0 & 0xe0;

    fuPayloadHeader[0] = 0x1c | fnri;

    if (isFirstPacket) {
      fuPayloadHeader[1] = 0x80 | nalType;
    } else if (isLastPacket) {
      fuPayloadHeader[1] = 0x40 | nalType;
    } else {
      fuPayloadHeader[1] = nalType;
    }

    return Buffer.concat([headerExtensionBuf, fuPayloadHeader, frameData]);
  }

  public override onFrameSent(): void {
    this.incrementTimestamp(90000 / this.fps);
  }
}
