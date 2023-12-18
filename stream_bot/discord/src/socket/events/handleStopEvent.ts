import { Streamer } from '$stream';

export const handleStopEvent = async (streamer: Streamer) => {
  streamer.stopStream();
  streamer.leaveVoice();
};
