import { Streamer } from '$helper/Streamer';
import { stop } from '$socket/actions/stop';

export const leave = async (streamer: Streamer) => {
  stop(streamer);
  streamer.leaveVoice();
};
