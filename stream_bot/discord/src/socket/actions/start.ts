import { z } from 'zod';

import { config } from '$config';
import { Streamer } from '$helper/Streamer';

export const startSchema = z.object({
  type: z.enum(['movie', 'tvshow']),
  startTime: z.string().optional(),
  mediaPath: z.string(),
  channelId: z.string(),
  guildId: z.string(),
});

type StartPayload = z.infer<typeof startSchema>;

export const start = async (streamer: Streamer, payload: StartPayload) => {
  const { mediaPath, channelId, guildId, type, startTime } = payload;

  await streamer.joinVoice(guildId, channelId);
  await streamer.createStream();

  const path = `${type === 'movie' ? config.MEDIA_PATH_MOVIES : config.MEDIA_PATH_SERIES}/${mediaPath}`;

  await streamer.startStream(path, {
    includeAudio: config.INCLUDE_AUDIO,
    hardwareAcceleration: config.HARDWARE_ACCELERATION,
    startTime,
  });

  streamer.stopStream();
};
