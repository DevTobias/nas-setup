import WebSocket from 'ws';

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
