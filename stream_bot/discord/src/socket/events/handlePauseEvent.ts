import { SocketStream } from '@fastify/websocket';

import { Streamer } from '$helper/Streamer';
import { send } from '$helper/ws';

export const handlePauseEvent = async (event: string, sock: SocketStream, streamer: Streamer) => {
  try {
    streamer.pauseStream();
    send(sock, { event, succeeded: true, data: 'pause_succeeded' });
  } catch (_) {
    send(sock, { event, succeeded: false, data: 'pause_failed' });
  }
};
