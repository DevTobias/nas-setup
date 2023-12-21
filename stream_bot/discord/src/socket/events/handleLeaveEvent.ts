import { SocketStream } from '@fastify/websocket';

import { Streamer } from '$helper/Streamer';
import { send } from '$helper/ws';
import { leave } from '$socket/actions/leave';

export const handleLeaveEvent = async (event: string, sock: SocketStream, streamer: Streamer) => {
  return leave(streamer)
    .catch(() => {})
    .then(() => send(sock, { event, succeeded: true }));
};
