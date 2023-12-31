import { Readable, Transform } from 'stream';

import ffmpeg, { FfmpegCommand } from 'fluent-ffmpeg';
import prism from 'prism-media';

import { UdpClient } from '$helper/Streamer/client/UdpClient';
import { StreamOutput } from '$helper/Streamer/streamLivestreamVideo/helper/FFMpegMultistream';
import { H264Transformer } from '$helper/Streamer/streamLivestreamVideo/helper/H264Transformer';
import { AudioStream } from '$helper/Streamer/streamLivestreamVideo/streams/AudioStream';
import { VideoStream } from '$helper/Streamer/streamLivestreamVideo/streams/VideoStream';

type StreamState = 'started' | 'ended' | 'playing' | 'error';

interface StreamOptions {
  includeAudio: boolean;
  startTime?: string;
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

export const streamLivestreamVideo = (
  input: string | Readable,
  udb: () => UdpClient | undefined,
  options: StreamOptions = initial
) => {
  const audioStream: AudioStream = new AudioStream(udb);
  const videoStream: VideoStream = new VideoStream(udb, options.fps, (time) => {
    options.onProgress(time);
  });

  const streamPromise = new Promise<void>((resolve, reject) => {
    const videoOutput: Transform = new H264Transformer();

    let command: FfmpegCommand | undefined;

    const handleError = (err: Error | unknown) => {
      command = undefined;
      options.onEvent('error', command);

      if (!err?.toString().includes('255')) {
        reject(new Error(`cannot play video ${err as Error}`));
      }
    };

    try {
      command = ffmpeg(input)
        .addOption('-loglevel', '0')
        .addOption('-fflags', 'nobuffer')
        .addOption('-analyzeduration', '0')
        .setStartTime(options.startTime ?? 0)
        .on('start', () => options.onEvent('started', command))
        .on('end', () => {
          const tryToEnd = () => {
            if (videoStream.stillFramesRemaining || audioStream.stillFramesRemaining) {
              setTimeout(() => tryToEnd(), 1000);
              return;
            }

            command = undefined;
            options.onEvent('ended', command);
            resolve();
          };

          tryToEnd();
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

  return [streamPromise, videoStream, audioStream] as const;
};
