import dotenv from 'dotenv';
import { object, string } from 'zod';

dotenv.config({ path: '../.env.local' });

export const configSchema = object({
  BOT_TOKEN: string(),
  BOT_CLIENT_ID: string(),
  TMDB_TOKEN: string(),
  MEDIA_PATH_SERIES: string(),
  MEDIA_PATH_MOVIES: string(),
});

export const config = configSchema.parse(process.env);
