import { z } from 'zod';

const fanartSchema = z.object({ tvposter: z.array(z.object({ url: z.string() })).optional() }).nullable();

export const seriesSchema = z.object({
  id: z.number(),
  name: z.string(),
  number_of_episodes: z.number(),
  number_of_seasons: z.number(),
  overview: z.string(),
  poster_path: z.string(),
  seasons: z.array(
    z.object({ episode_count: z.number(), id: z.number(), poster_path: z.string().nullable(), name: z.string() })
  ),
  fanart: z.preprocess((val) => ((val as { status: string }).status !== 'error' ? val : null), fanartSchema),
  existing_seasons: z.array(z.object({ season_number: z.string(), episodes: z.array(z.string()) })),
});

export type SeriesMetadata = z.infer<typeof seriesSchema>;
