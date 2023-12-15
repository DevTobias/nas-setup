import Fuse from 'fuse.js';
import { z } from 'zod';

import { config } from '$config';
import { endpoints } from '$endpoints';
import { BaseMediaStore } from '$features/media/helper/BaseMediaStore';

export const tvShowSchema = z.object({
  id: z.number(),
  name: z.string(),
  number_of_episodes: z.number(),
  number_of_seasons: z.number(),
  overview: z.string(),
  poster_path: z.string(),
  existing_seasons: z.array(z.object({ season_number: z.string(), episodes: z.array(z.string()) })),
  seasons: z.array(
    z.object({ episode_count: z.number(), id: z.number(), poster_path: z.string().nullable(), name: z.string() })
  ),
  fanart: z.preprocess(
    (val) => ((val as { status: string }).status !== 'error' ? val : null),
    z.object({ tvposter: z.array(z.object({ url: z.string() })).optional() }).nullable()
  ),
});

export class TvShowStore extends BaseMediaStore<z.infer<typeof tvShowSchema>> {
  constructor() {
    super(
      tvShowSchema.parse,
      (meta) => [meta.name, meta.fanart?.tvposter?.[0]?.url ?? endpoints.tmdbImage(meta.poster_path)],
      config.MEDIA_PATH_SERIES
    );
  }

  public getTvShows = async (page: number, query: string | undefined) => {
    const [shows, image] = await this.getMediaSummary(page, (media) => {
      if (!query) return media;
      return new Fuse(media, { keys: ['meta.name'], threshold: 0.3 }).search(query).map((result) => result.item);
    });

    const titles = shows.map((show) => show.meta.name);
    return [titles, image] as const;
  };
}
