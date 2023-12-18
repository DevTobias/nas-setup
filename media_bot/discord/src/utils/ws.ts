import WebSocket from 'ws';
import { z } from 'zod';

export const parsePayload = (payload: WebSocket.RawData) => {
  const scheme = z.object({ event: z.string(), succeeded: z.boolean(), data: z.string() });
  return scheme.parse(JSON.parse(payload.toString()));
};

export const send = (ws: WebSocket, data: unknown) => ws.send(JSON.stringify(data));

export const connectToWebSocket = (url: string) => {
  return new Promise<WebSocket>((resolve, reject) => {
    const ws = new WebSocket(url);

    ws.on('open', () => {
      console.log('Connected to WebSocket server');
      resolve(ws);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error: ${error}`);
      reject(error);
    });
  });
};
