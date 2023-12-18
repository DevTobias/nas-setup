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

const fastify = Fastify({ logger: false });

fastify.register(fastifyWebSocket);

streamer.client.on('ready', () => {
  console.log(`[INFO] Client for user ${streamer.client.user!.tag} is ready`);
});

fastify.register(async (server) => {
  server.get('/stream', { websocket: true }, (connection) => {
    connection.socket.on('message', (message) => handleSocketMessage(streamer, connection, message.toString()));
  });
});

fastify.listen({ port: config.PORT }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`[INFO] Server listening at ${address}`);
});

streamer.client.login(config.CLIENT_TOKEN);
