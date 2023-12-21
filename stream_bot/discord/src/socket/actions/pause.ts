import { Streamer } from '$helper/Streamer';

export const pause = async (streamer: Streamer) => {
  streamer.pauseStream();
};
