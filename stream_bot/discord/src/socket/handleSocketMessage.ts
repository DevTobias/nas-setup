import { SocketStream } from '@fastify/websocket';
import z from 'zod';

import { send } from '$helper/ws';
import { handlePauseEvent } from '$socket/events/handlePauseEvent';
import { handleResumeEvent } from '$socket/events/handleResumeEvent';
import { handleStartEvent } from '$socket/events/handleStartEvent';
import { handleStopEvent } from '$socket/events/handleStopEvent';
import { Streamer } from '$stream';

const messageSchema = z.object({
  event: z.enum(['start', 'stop', 'pause', 'resume']),
  data: z.unknown(),
});

export const handleSocketMessage = (streamer: Streamer, conn: SocketStream, msg: string) => {
  const parsed = messageSchema.safeParse(JSON.parse(msg));

  if (!parsed.success) {
    console.error('Invalid message received', parsed.error);
    return send(conn, { event: 'payload_error', succeeded: false, data: 'invalid_message' });
  }

  const { event, data } = parsed.data;

  switch (event) {
    case 'start':
      return handleStartEvent('start', conn, streamer, data);
    case 'stop':
      return handleStopEvent('stop', conn, streamer);
    case 'pause':
      return handlePauseEvent('pause', conn, streamer);
    case 'resume':
      return handleResumeEvent('resume', conn, streamer);
    default:
      break;
  }

  return null;
};
