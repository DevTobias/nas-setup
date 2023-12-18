import Fuse from 'fuse.js';
import { z } from 'zod';

import { config } from '$config';
import { endpoints } from '$endpoints';
import { BaseMediaStore } from '$features/media/helper/BaseMediaStore';

export const movieSchema = z.object({
  id: z.number(),
  imdb_id: z.string(),
  title: z.string(),
  overview: z.string(),
  runtime: z.number(),
  vote_average: z.number(),
  release_date: z.string().transform((val) => new Date(val)),
  backdrop_path: z.string(),
  poster_path: z.string(),
  fan_arts: z.object({ movieposter: z.string().nullable(), moviethumb: z.string().nullable() }).nullable(),
  file: z.string(),
});

export type Movie = z.infer<typeof movieSchema>;

export class MovieStore extends BaseMediaStore<Movie> {
  constructor() {
    super(
      movieSchema.parse,
      (meta) => [meta.title, meta.fan_arts?.movieposter ?? endpoints.tmdbImage(meta.poster_path)],
      config.MEDIA_PATH_MOVIES
    );
  }

  public search = (query: string, media = this.media) => {
    const results = new Fuse(media, { keys: ['meta.title'], threshold: 0.3 }).search(query).map((result) => result.item);
    return results && results.length > 0 ? results[0] : null;
  };

  public searchAll = async (page: number, query: string | undefined) => {
    const [movies, image] = await this.getMediaSummary(page, (media) => {
      if (!query) return media;
      return new Fuse(media, { keys: ['meta.title'], threshold: 0.3 }).search(query).map((result) => result.item);
    });

    const titles = movies.map((movie) => movie.meta.title);
    return [titles, image] as const;
  };
}
