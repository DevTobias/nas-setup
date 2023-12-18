import { Transform, TransformCallback } from 'stream';

type NalInfo = {
  startCodeLength: number;
  nalLength: number;
};

const epbSuffix = [0x00, 0x01, 0x02, 0x03];

enum NalUnitTypes {
  Unspecified,
  CodedSliceNonIDR,
  CodedSlicePartitionA,
  CodedSlicePartitionB,
  CodedSlicePartitionC,
  CodedSliceIdr,
  SEI,
  SPS,
  PPS,
  AccessUnitDelimiter,
  EndOfSequence,
  EndOfStream,
  FillerData,
  SEIExtenstion,
  PrefixNalUnit,
  SubsetSPS,
}

/**
 * Removes emulation prevention bytes from a nalu frame
 *
 * @description there are chances that 0x000001 or 0x00000001 exists in the bitstream of a NAL unit.
 * So a emulation prevention bytes, 0x03, is presented when there is 0x000000, 0x000001, 0x000002 and 0x000003
 * to make them become 0x00000300, 0x00000301, 0x00000302 and 0x00000303 respectively
 *
 * @param data
 * @returns frame with emulation prevention bytes removed
 */
const rbsp = (data: Buffer): Buffer => {
  const len = data.byteLength;
  let pos = 0;
  const epbs = [];

  while (pos < len - 3) {
    if (data[pos] === 0 && data[pos + 1] === 0 && data[pos + 2] === 0x03 && epbSuffix.includes(data[pos + 3])) {
      epbs.push(pos + 2);
      pos += 3;
    } else {
      pos += 1;
    }
  }

  if (epbs.length === 0) return data;

  const frame = new Uint8Array(len - epbs.length);

  pos = 0;
  for (let i = 0; i < frame.length; i += 1) {
    if (pos === epbs[0]) {
      pos += 1;
      epbs.shift();
    }
    frame[i] = data[pos];
    pos += 1;
  }

  return Buffer.from(frame);
};

/**
 * Returns true if nal magic string with specified length was found.
 * Nal magic string is either 001 or 0001 depending on length
 *
 * @param buf
 * @param magicLength either 3 or 4
 * @returns true if nalu magic string was found
 */
const findNalByMagicString = (buf: Buffer, magicLength: 3 | 4) => {
  let found = false;

  if (magicLength === 3) {
    if (buf[0] === 0 && buf[1] === 0 && buf[2] === 1) found = true;
  } else if (magicLength === 4) {
    if (buf[0] === 0 && buf[1] === 0 && buf[2] === 0 && buf[3] === 1) found = true;
  } else {
    throw Error('invalid magic length for h264 nal unit');
  }

  return found;
};

/**
 * Finds the next nal unit in a buffer.
 *
 * @param buf buffer containing nal units
 * @returns found nalu unit information
 */
const parseNal = (buf: Buffer): NalInfo => {
  const nalInfo: NalInfo = {
    startCodeLength: 0,
    nalLength: 0,
  };

  if (findNalByMagicString(buf, 3)) {
    nalInfo.startCodeLength = 3;
  } else if (findNalByMagicString(buf, 4)) {
    nalInfo.startCodeLength = 4;
  }

  // If we find the next start code, then we are done
  const remainingLen = buf.length - nalInfo.startCodeLength;

  for (let i = 0; i < remainingLen; i += 1) {
    if (
      findNalByMagicString(buf.subarray(nalInfo.startCodeLength + i), 3) ||
      findNalByMagicString(buf.subarray(nalInfo.startCodeLength + i), 4)
    ) {
      nalInfo.nalLength = i + nalInfo.startCodeLength;
      break;
    }
  }

  return nalInfo;
};

/**
 * Outputs a buffer containing length-delimited nalu units
 * that belong to the same access unit.
 * Expects an AnnexB H264 bytestream as input.
 *
 * In a h264 stream, 1 frame is equal to 1 access unit, and an access
 * unit is composed of 1 to n Nal units
 */
export class H264Transformer extends Transform {
  private _buffer: Buffer | undefined;

  private _accessUnit: Buffer[] = [];

  _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void {
    this._appendChunkToBuf(chunk);

    while (this._buffer && this._buffer.length > 0) {
      const nalInfo = parseNal(this._buffer);

      if (nalInfo.nalLength === 0) {
        break;
      } else {
        const frame = this._buffer.subarray(nalInfo.startCodeLength, nalInfo.nalLength);

        this._updateBufLen(nalInfo.nalLength);

        const header = frame[0];

        const unitType = header & 0x1f;

        if (unitType === NalUnitTypes.AccessUnitDelimiter) {
          if (this._accessUnit.length > 0) {
            let sizeOfAccessUnit = 0;
            this._accessUnit.forEach((nalu) => (sizeOfAccessUnit += nalu.length));

            const accessUnitBuf = Buffer.alloc(sizeOfAccessUnit + 4 * this._accessUnit.length);

            let offset = 0;
            for (const nalu of this._accessUnit) {
              accessUnitBuf.writeUint32BE(nalu.length, offset);
              offset += 4;
              nalu.copy(accessUnitBuf, offset);
              offset += nalu.length;
            }

            this.push(accessUnitBuf);
            this._accessUnit = [];
          }
        } else if (unitType === NalUnitTypes.SPS || unitType === NalUnitTypes.SEI) {
          const rbspFrame = rbsp(frame);
          this._accessUnit.push(rbspFrame);
        } else {
          this._accessUnit.push(frame);
        }
      }
    }

    callback();
  }

  _appendChunkToBuf(chunk: Buffer) {
    if (this._buffer) this._buffer = Buffer.concat([this._buffer, chunk]);
    else this._buffer = chunk;
  }

  _updateBufLen(size: number) {
    if (this._buffer && this._buffer.length > size) this._buffer = this._buffer.subarray(size, this._buffer.length);
    else this._buffer = undefined;
  }
}
