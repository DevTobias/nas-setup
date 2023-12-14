import { Client } from 'discord.js-selfbot-v13';

import { config } from '$config';
import { getDirectories, getMovieUrl, getSeriesDetails, getSeriesUrl } from '$helper/MediaReader';
import { VideoPlayer } from '$helper/VideoPlayer';
import { Streamer, UdpClient } from '$stream';

const streamer = new Streamer(new Client({ checkUpdate: false }), {
  fps: config.FPS,
  height: config.HEIGHT,
  width: config.WIDTH,
  maxBitrateKbps: config.BITRATE_KBPS,
});

streamer.client.on('ready', () => {
  console.log(`--- ${streamer.client.user!.tag} is ready ---`);
});

let player: VideoPlayer;
let currentStream: UdpClient | undefined;

const createNewVideoPlayer = (url: string) => {
  return new VideoPlayer(url, {
    fps: config.FPS,
    includeAudio: config.INCLUDE_AUDIO,
    hardwareAcceleration: config.HARDWARE_ACCELERATION,
  });
};

streamer.client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content) return;

  if (msg.content.startsWith(`$help`)) {
    msg.channel.send(
      [
        '### Available Commands',
        '- `$start movie <movie name>` - start a movie stream (eg. $start movie John Wick (2014))',
        '- `$start series S<season number>E<episode number> <series name>` - start a series stream (eg. $start series S01E01 Chainsaw Man)',
        '- `$pause` - pause the current stream',
        '- `$resume` - resume the current stream',
        '- `$movies` - list all available movies',
        '- `$series` - list all available series',
        '- `$details <series name>` - list all available seasons and episodes of a series`',
      ].join('\n')
    );

    return;
  }

  if (msg.content.startsWith(`$leave`)) {
    streamer.leaveVoice();
  }

  if (msg.content.startsWith(`$start`)) {
    try {
      const [, type, ...args] = msg.content.split(' ');

      const url =
        type === 'movie'
          ? getMovieUrl(config.MEDIA_PATH_MOVIES, args.join(' '))
          : getSeriesUrl(config.MEDIA_PATH_SERIES, args[0], args.slice(1).join(' '));

      player = createNewVideoPlayer(url);

      const { channel } = msg.author.voice;
      if (!channel) {
        msg.channel.send('### You must be in a voice channel to start a stream ❌');
        return;
      }

      await streamer.joinVoice(msg.guildId!, channel.id);
      currentStream = await streamer.createStream();

      await player.play(currentStream);
      streamer.stopStream();
      streamer.leaveVoice();
    } catch (e) {
      msg.channel.send('### Could not find media ❌\nYou can list all available media with `$movies` or `$series`.');
    }

    return;
  }

  if (msg.content.startsWith('$pause')) {
    if (!currentStream) {
      msg.channel.send('### No active stream ❌\nYou must start a stream with `$start` before you can pause it.');
      return;
    }

    player.pause(currentStream);

    return;
  }

  if (msg.content.startsWith('$resume')) {
    if (!currentStream) {
      msg.channel.send('### No active stream ❌\nYou must start a stream with `$start` before you can resume it.');
      return;
    }

    player.resume(currentStream);

    return;
  }

  if (msg.content.startsWith('$movies')) {
    const movies = getDirectories(config.MEDIA_PATH_MOVIES);
    msg.channel.send(`\`\`\`${movies.join('\n')}\`\`\``);
    return;
  }

  if (msg.content.startsWith('$series')) {
    const series = getDirectories(config.MEDIA_PATH_SERIES);
    msg.channel.send(`\`\`\`${series.join('\n')}\`\`\``);
    return;
  }

  if (msg.content.startsWith('$details')) {
    const [, ...args] = msg.content.split(' ');
    const seriesName = args.join(' ');

    try {
      const seasons = getSeriesDetails(config.MEDIA_PATH_SERIES, seriesName);
      msg.channel.send(`\`\`\`###${seriesName}\n   ${seasons.join('\n   ')}\`\`\``);
    } catch (e) {
      msg.channel.send('### Invalid series number ❌');
    }
  }
});

streamer.client.login(config.CLIENT_TOKEN);
