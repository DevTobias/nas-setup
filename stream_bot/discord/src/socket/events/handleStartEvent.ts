import { SocketStream } from '@fastify/websocket';

import { Streamer } from '$helper/Streamer';
import { send } from '$helper/ws';
import { start, startSchema } from '$socket/actions/start';

export const handleStartEvent = async (event: string, conn: SocketStream, streamer: Streamer, raw: unknown) => {
  const parsed = startSchema.safeParse(raw);

  if (!parsed.success) {
    console.error('Invalid start payload received', parsed.error);
    return send(conn, { event: 'payload_error', succeeded: false, data: 'invalid_start_payload' });
  }

  return start(streamer, parsed.data)
    .then(() => send(conn, { event, succeeded: true }))
    .catch((e) => {
      console.error('Failed to start stream', e);
      send(conn, { event, succeeded: false });
    });
};
