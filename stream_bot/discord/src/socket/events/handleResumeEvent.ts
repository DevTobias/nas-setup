import { SocketStream } from '@fastify/websocket';

import { Streamer } from '$helper/Streamer';
import { send } from '$helper/ws';
import { resume } from '$socket/actions/resume';

export const handleResumeEvent = async (event: string, sock: SocketStream, streamer: Streamer) => {
  return resume(streamer)
    .catch(() => {})
    .then(() => send(sock, { event, succeeded: true }));
};
