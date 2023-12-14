import dotenv from 'dotenv';
import { object, string } from 'zod';

dotenv.config({ path: '../.env.local' });

export const configSchema = object({
  BOT_TOKEN: string(),
});

export const config = configSchema.parse(process.env);
