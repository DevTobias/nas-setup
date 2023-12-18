import udpCon from 'dgram';
import { isIPv4 } from 'net';

import { BaseMediaConnection } from '$helper/Streamer/client/connections/BaseMediaConnection';
import { AudioPacketizer } from '$helper/Streamer/client/packetizer/AudioPacketizer';
import { BaseMediaPacketizer, Max32BitInt } from '$helper/Streamer/client/packetizer/BaseMediaPacketizer';
import { VideoPacketizerH264 } from '$helper/Streamer/client/packetizer/VideoPacketizerH264';

function parseLocalPacket(message: Buffer) {
  const packet = Buffer.from(message);
  const ip = packet.subarray(8, packet.indexOf(0, 8)).toString('utf8');
  if (!isIPv4(ip)) throw new Error('Malformed IP address');
  const port = packet.readUInt16BE(packet.length - 2);
  return { ip, port };
}

export class UdpClient {
  private _mediaConnection: BaseMediaConnection;

  private _nonce: number;

  private _socket!: udpCon.Socket;

  private _ready!: boolean;

  private _audioPacketizer: BaseMediaPacketizer;

  private _videoPacketizer: BaseMediaPacketizer;

  constructor(voiceConnection: BaseMediaConnection, fps: number) {
    this._nonce = 0;
    this._mediaConnection = voiceConnection;
    this._audioPacketizer = new AudioPacketizer(this);
    this._videoPacketizer = new VideoPacketizerH264(this, fps);
  }

  public getNewNonceBuffer(): Buffer {
    const nonceBuffer = Buffer.alloc(24);
    this._nonce += 1;
    if (this._nonce > Max32BitInt) this._nonce = 0;

    nonceBuffer.writeUInt32BE(this._nonce, 0);
    return nonceBuffer;
  }

  public get audioPacketizer(): BaseMediaPacketizer {
    return this._audioPacketizer;
  }

  public get videoPacketizer(): BaseMediaPacketizer {
    return this._videoPacketizer;
  }

  public get mediaConnection(): BaseMediaConnection {
    return this._mediaConnection;
  }

  public sendAudioFrame(frame: Buffer): void {
    if (!this.ready) return;
    this.audioPacketizer.sendFrame(frame);
  }

  public sendVideoFrame(frame: Buffer): void {
    if (!this.ready) return;
    this.videoPacketizer.sendFrame(frame);
  }

  public sendPacket(packet: Buffer): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this._socket.send(packet, 0, packet.length, this._mediaConnection.port, this._mediaConnection.address, (error) => {
          if (error) {
            console.log('ERROR', error);
            reject(error);
          }
          resolve();
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  public get ready(): boolean {
    return this._ready;
  }

  public set ready(val: boolean) {
    this._ready = val;
  }

  public stop(): void {
    try {
      this.ready = false;
      this._socket?.disconnect();
    } catch (e) {
      // Already disconnected socket
    }
  }

  public createUdp(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._socket = udpCon.createSocket('udp4');

      this._socket.on('error', (error: Error) => {
        console.error('Error connecting to media udp server', error);
        reject(error);
      });

      this._socket.once('message', (message) => {
        if (message.readUInt16BE(0) !== 2) {
          reject(new Error('wrong handshake packet for udp'));
        }

        try {
          const packet = parseLocalPacket(message);

          this._mediaConnection.self_ip = packet.ip;
          this._mediaConnection.self_port = packet.port;
          this._mediaConnection.setProtocols();
        } catch (e) {
          reject(e);
        }

        resolve();
      });

      const blank = Buffer.alloc(74);

      blank.writeUInt16BE(1, 0);
      blank.writeUInt16BE(70, 2);
      blank.writeUInt32BE(this._mediaConnection.ssrc, 4);

      this._socket.send(blank, 0, blank.length, this._mediaConnection.port, this._mediaConnection.address, (error) => {
        if (error) {
          reject(error);
        }
      });
    });
  }
}
