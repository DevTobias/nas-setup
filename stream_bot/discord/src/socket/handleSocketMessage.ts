import { SocketStream } from '@fastify/websocket';
import z from 'zod';

import { handleStartEvent } from '$socket/events/handleStartEvent';
import { handleStopEvent } from '$socket/events/handleStopEvent';
import { Streamer } from '$stream';

const messageSchema = z.object({
  event: z.enum(['start', 'stop', 'pause', 'resume']),
  data: z.unknown(),
});

export const handleSocketMessage = (streamer: Streamer, connection: SocketStream, msg: string) => {
  console.log(msg);

  const parsed = messageSchema.safeParse(JSON.parse(msg));

  const wsSend = (data: unknown) => connection.socket.send(JSON.stringify(data));

  if (!parsed.success) {
    return wsSend({ event: 'error', data: { error: parsed.error, code: 'invalid_message' } });
  }

  const { event, data } = parsed.data;

  switch (event) {
    case 'start':
      return wsSend(handleStartEvent(streamer, data));
    case 'stop':
      return wsSend(handleStopEvent(streamer));
    case 'pause':
      console.log('pause');
      break;
    case 'resume':
      console.log('resume');
      break;
    default:
      break;
  }

  return null;
};
