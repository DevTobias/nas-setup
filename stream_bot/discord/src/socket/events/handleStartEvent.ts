import { z } from 'zod';

import { config } from '$config';
import { VideoPlayer } from '$helper/VideoPlayer';
import { Streamer } from '$stream';

const startEventSchema = z.object({
  type: z.enum(['movie', 'tvshow']),
  mediaPath: z.string(),
  channelId: z.string(),
  guildId: z.string(),
});

export const handleStartEvent = async (streamer: Streamer, raw: unknown) => {
  const parsed = startEventSchema.safeParse(raw);

  if (!parsed.success) {
    return { event: 'error', data: { error: parsed.error, code: 'invalid_start_payload' } };
  }

  const { mediaPath, channelId, guildId, type } = parsed.data;

  const player = new VideoPlayer(`${type === 'movie' ? config.MEDIA_PATH_MOVIES : config.MEDIA_PATH_SERIES}/${mediaPath}`, {
    fps: config.FPS,
    includeAudio: config.INCLUDE_AUDIO,
    hardwareAcceleration: config.HARDWARE_ACCELERATION,
  });

  await streamer.joinVoice(guildId, channelId);

  const stream = await streamer.createStream();
  await player.play(stream);

  streamer.stopStream();
  streamer.leaveVoice();
};
