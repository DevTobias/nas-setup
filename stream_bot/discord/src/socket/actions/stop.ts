import { Streamer } from '$helper/Streamer';

export const stop = async (streamer: Streamer) => {
  streamer.stopStream();
};
