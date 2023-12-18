import { SocketStream } from '@fastify/websocket';
import z from 'zod';

import { Streamer } from '$helper/Streamer';
import { send } from '$helper/ws';
import { handleLeaveEvent } from '$socket/events/handleLeaveEvent';
import { handlePauseEvent } from '$socket/events/handlePauseEvent';
import { handleResumeEvent } from '$socket/events/handleResumeEvent';
import { handleStartEvent } from '$socket/events/handleStartEvent';
import { handleStopEvent } from '$socket/events/handleStopEvent';

const messageSchema = z.object({
  event: z.enum(['start', 'stop', 'pause', 'resume', 'restart', 'leave']),
  data: z.unknown(),
});

export const handleSocketMessage = async (streamer: Streamer, conn: SocketStream, msg: string) => {
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
    case 'restart':
      handleStopEvent('stop', conn, streamer);
      return setTimeout(() => handleStartEvent('restart', conn, streamer, data), 1000);
    case 'leave':
      return handleLeaveEvent('leave', conn, streamer);
    default:
      break;
  }

  return null;
};
