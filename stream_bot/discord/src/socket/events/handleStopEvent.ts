import { SocketStream } from '@fastify/websocket';

import { Streamer } from '$helper/Streamer';
import { send } from '$helper/ws';
import { stop } from '$socket/actions/stop';

export const handleStopEvent = async (event: string, sock: SocketStream, streamer: Streamer) => {
  return stop(streamer)
    .catch(() => {})
    .then(() => send(sock, { event, succeeded: true }));
};
