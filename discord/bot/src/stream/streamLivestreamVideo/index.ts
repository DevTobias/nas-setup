import { Readable, Transform } from 'stream';

import { StreamOutput } from '@dank074/fluent-ffmpeg-multistream-ts';
import ffmpeg, { FfmpegCommand } from 'fluent-ffmpeg';
import prism from 'prism-media';

import { UdpClient } from '$stream/Streamer/client/UdpClient';
import { H264Transformer } from '$stream/streamLivestreamVideo/helper/H264Transformer';
import { AudioStream } from '$stream/streamLivestreamVideo/streams/AudioStream';
import { VideoStream } from '$stream/streamLivestreamVideo/streams/VideoStream';

type StreamState = 'started' | 'ended' | 'playing' | 'error';

interface StreamOptions {
  includeAudio: boolean;
  fps: number;
  hardwareAcceleration: boolean;
  onEvent: (state: StreamState, command: FfmpegCommand | undefined) => void;
  onProgress: (time: number) => void;
}

const initial: StreamOptions = {
  includeAudio: true,
  onEvent: () => {},
  onProgress: () => {},
  hardwareAcceleration: false,
  fps: 30,
};

export const streamLivestreamVideo = (input: string | Readable, mediaUdp: UdpClient, options: StreamOptions = initial) => {
  return new Promise<void>((resolve, reject) => {
    const videoOutput: Transform = new H264Transformer();
    const videoStream: VideoStream = new VideoStream(mediaUdp, options.fps, (time) => {
      options.onProgress(time);
    });

    let command: FfmpegCommand | undefined;

    const handleError = (err: Error | unknown) => {
      command = undefined;
      options.onEvent('error', command);
      reject(new Error(`cannot play video ${err as Error}`));
    };

    try {
      command = ffmpeg(input)
        .addOption('-loglevel', '0')
        .addOption('-fflags', 'nobuffer')
        .addOption('-analyzeduration', '0')
        .on('start', () => options.onEvent('started', command))
        .on('end', () => {
          command = undefined;
          options.onEvent('ended', command);
          resolve();
        })
        .on('error', handleError)
        .on('stderr', handleError);

      command
        .output(StreamOutput(videoOutput).url, { end: false })
        .noAudio()
        .on('progress', () => options.onEvent('playing', command))
        .format('h264')
        .fpsOutput(options.fps)
        .outputOptions([
          '-tune zerolatency',
          '-pix_fmt yuv420p',
          '-profile:v baseline',
          '-preset ultrafast',
          `-g ${options.fps}`,
          `-x264-params keyint=${options.fps}:min-keyint=${options.fps}`,
          '-bsf:v h264_metadata=aud=insert',
        ])
        .on('error', handleError)
        .on('stderr', handleError);

      videoOutput.pipe(videoStream, { end: false });

      if (options.includeAudio) {
        const audioStream: AudioStream = new AudioStream(mediaUdp);
        const opus = new prism.opus.Encoder({ channels: 2, rate: 48000, frameSize: 960 });

        command
          .output(StreamOutput(opus).url, { end: false })
          .noVideo()
          .audioChannels(2)
          .audioFrequency(48000)
          .format('s16le');

        opus.pipe(audioStream, { end: false });
      }

      if (options.hardwareAcceleration) {
        command.inputOption('-hwaccel', 'auto');
      }

      command.run();
    } catch (e) {
      handleError(e);
    }
  });
};
