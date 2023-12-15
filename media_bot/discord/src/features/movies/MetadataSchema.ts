import { z } from 'zod';

const fanartSchema = z.object({ movieposter: z.array(z.object({ url: z.string() })) }).nullable();

export const movieSchema = z.object({
  id: z.number(),
  imdb_id: z.string(),
  poster_path: z.string(),
  runtime: z.number(),
  title: z.string(),
  file: z.string(),
  fanart: z.preprocess((val) => ((val as { status: string }).status !== 'error' ? val : null), fanartSchema),
});

export type MovieMetadata = z.infer<typeof movieSchema>;
