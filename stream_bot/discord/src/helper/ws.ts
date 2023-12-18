import { SocketStream } from '@fastify/websocket';

export const send = (conn: SocketStream, data: unknown) => conn.socket.send(JSON.stringify(data));
