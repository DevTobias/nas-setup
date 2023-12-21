import fastifyWebSocket from '@fastify/websocket';
import { Client } from 'discord.js-selfbot-v13';
import Fastify from 'fastify';

import { config } from '$config';
import { Streamer } from '$helper/Streamer';
import { handleSocketMessage } from '$socket/handleSocketMessage';

const streamer = new Streamer(new Client({ checkUpdate: false }), {
  fps: config.FPS,
  height: config.HEIGHT,
  width: config.WIDTH,
  maxBitrateKbps: config.BITRATE_KBPS,
});

const fastify = Fastify({ logger: true });
fastify.register(fastifyWebSocket);

streamer.client.on('ready', () => {
  fastify.log.info(`Client for user ${streamer.client.user!.tag} is ready`);
});

fastify.register(async (server) => {
  server.get('/stream', { websocket: true }, (connection) => {
    connection.socket.on('message', (message) => handleSocketMessage(streamer, connection, message.toString()));
  });
});

fastify.listen({ port: config.PORT, host: '0.0.0.0' }, (err, address) => {
  fastify.log.info(err ?? `Server listening at ${address}`);
});

streamer.client.login(config.CLIENT_TOKEN);
