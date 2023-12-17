import Fuse from 'fuse.js';
import { z } from 'zod';

import { config } from '$config';
import { endpoints } from '$endpoints';
import { BaseMediaStore } from '$features/media/helper/BaseMediaStore';

export const tvShowSchema = z.object({
  id: z.number(),
  name: z.string(),
  overview: z.string(),
  vote_average: z.number(),
  status: z.string(),
  first_air_date: z.string(),
  last_air_date: z.string(),
  number_of_episodes: z.number(),
  number_of_seasons: z.number(),
  poster_path: z.string(),
  backdrop_path: z.string(),
  fan_arts: z.object({ tvposter: z.string().nullable(), tvthumb: z.string().nullable() }).nullable(),
  seasons: z.array(
    z.object({
      season_number: z.number(),
      name: z.string(),
      overview: z.string(),
      poster_path: z.string().nullable(),
      vote_average: z.number(),
      missing_episodes: z.number(),
      episodes: z.array(
        z.object({
          episode_number: z.number(),
          name: z.string(),
          overview: z.string(),
          vote_average: z.number(),
          still_path: z.string().nullable(),
          file: z.string().nullable(),
        })
      ),
    })
  ),
});

export class TvShowStore extends BaseMediaStore<z.infer<typeof tvShowSchema>> {
  constructor() {
    super(
      tvShowSchema.parse,
      (meta) => [meta.name, meta.fan_arts?.tvposter ?? endpoints.tmdbImage(meta.poster_path)],
      config.MEDIA_PATH_SERIES
    );
  }

  public searchTvShow = (query: string, media = this.media) => {
    const results = new Fuse(media, { keys: ['meta.name'], threshold: 0.3 }).search(query).map((result) => result.item);
    return results && results.length > 0 ? results[0] : null;
  };

  public getTvShows = async (page: number, query: string | undefined) => {
    const [shows, image] = await this.getMediaSummary(page, (media) => {
      if (!query) return media;
      return new Fuse(media, { keys: ['meta.name'], threshold: 0.3 }).search(query).map((result) => result.item);
    });

    const titles = shows.map((show) => show.meta.name);
    return [titles, image] as const;
  };
}
