import { SocketStream } from '@fastify/websocket';

import { send } from '$helper/ws';
import { Streamer } from '$stream';

export const handleResumeEvent = async (event: string, sock: SocketStream, streamer: Streamer) => {
  try {
    streamer.resumeStream();
    send(sock, { event, succeeded: true, data: 'resume_succeeded' });
  } catch (_) {
    send(sock, { event, succeeded: false, data: 'resume_failed' });
  }
};
