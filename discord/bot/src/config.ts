import dotenv from 'dotenv';
import { boolean, number, object, string } from 'zod';

dotenv.config({ path: '../.env' });

export const configSchema = object({
  CLIENT_TOKEN: string(),
  MEDIA_PATH_SERIES: string(),
  MEDIA_PATH_MOVIES: string(),

  WIDTH: number().default(1920),
  HEIGHT: number().default(1080),
  FPS: number().default(30),
  INCLUDE_AUDIO: boolean().default(true),
  BITRATE_KBPS: number().default(5000),
  HARDWARE_ACCELERATION: boolean().default(false),
});

export const config = configSchema.parse(process.env);
