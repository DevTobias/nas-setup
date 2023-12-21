import { Streamer } from '$helper/Streamer';

export const resume = async (streamer: Streamer) => {
  streamer.resumeStream();
};
