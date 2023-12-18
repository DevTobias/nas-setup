import { SocketStream } from '@fastify/websocket';

import { Streamer } from '$helper/Streamer';
import { send } from '$helper/ws';

export const handleStopEvent = async (event: string, sock: SocketStream, streamer: Streamer) => {
  streamer.stopStream();
  send(sock, { event, succeeded: true, data: 'stop_succeeded' });
};
