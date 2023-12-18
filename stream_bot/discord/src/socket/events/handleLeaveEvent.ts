import { SocketStream } from '@fastify/websocket';

import { Streamer } from '$helper/Streamer';
import { send } from '$helper/ws';

export const handleLeaveEvent = async (event: string, sock: SocketStream, streamer: Streamer) => {
  streamer.stopStream();
  streamer.leaveVoice();
  send(sock, { event, succeeded: true, data: 'leave_succeeded' });
};
