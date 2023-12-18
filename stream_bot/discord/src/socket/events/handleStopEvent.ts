import { SocketStream } from '@fastify/websocket';

import { send } from '$helper/ws';
import { Streamer } from '$stream';

export const handleStopEvent = async (event: string, sock: SocketStream, streamer: Streamer) => {
  try {
    streamer.stopStream();
    streamer.leaveVoice();
    send(sock, { event, succeeded: true, data: 'stop_succeeded' });
  } catch (_) {
    send(sock, { event, succeeded: false, data: 'stop_stream_failed' });
  }
};
