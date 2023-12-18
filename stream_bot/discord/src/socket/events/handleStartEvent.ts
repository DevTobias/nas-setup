import { SocketStream } from '@fastify/websocket';
import { z } from 'zod';

import { config } from '$config';
import { send } from '$helper/ws';
import { Streamer } from '$stream';

const startEventSchema = z.object({
  type: z.enum(['movie', 'tvshow']),
  mediaPath: z.string(),
  channelId: z.string(),
  guildId: z.string(),
});

export const handleStartEvent = async (event: string, conn: SocketStream, streamer: Streamer, raw: unknown) => {
  const parsed = startEventSchema.safeParse(raw);

  if (!parsed.success) {
    console.error('Invalid start payload received', parsed.error);
    return send(conn, { event: 'payload_error', succeeded: false, data: 'invalid_start_payload' });
  }

  const { mediaPath, channelId, guildId, type } = parsed.data;

  try {
    await streamer.joinVoice(guildId, channelId);
    await streamer.createStream();

    const path = `${type === 'movie' ? config.MEDIA_PATH_MOVIES : config.MEDIA_PATH_SERIES}/${mediaPath}`;
    await streamer.startStream(path, {
      includeAudio: config.INCLUDE_AUDIO,
      hardwareAcceleration: config.HARDWARE_ACCELERATION,
    });

    send(conn, { event, succeeded: true, data: 'stream_finished' });

    streamer.stopStream();
    streamer.leaveVoice();
  } catch (e) {
    console.error('Failed to start stream', e);
    send(conn, { event, succeeded: false, data: 'start_stream_failed' });
  }
};
