import { SocketStream } from '@fastify/websocket';

import { Streamer } from '$helper/Streamer';
import { send } from '$helper/ws';
import { pause } from '$socket/actions/pause';

export const handlePauseEvent = async (event: string, sock: SocketStream, streamer: Streamer) => {
  return pause(streamer)
    .catch(() => {})
    .then(() => send(sock, { event, succeeded: true }));
};
