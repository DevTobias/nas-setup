import Fuse from 'fuse.js';
import { z } from 'zod';

import { config } from '$config';
import { endpoints } from '$endpoints';
import { BaseMediaStore } from '$features/media/helper/BaseMediaStore';

export const movieSchema = z.object({
  id: z.number(),
  imdb_id: z.string(),
  poster_path: z.string(),
  runtime: z.number(),
  title: z.string(),
  file: z.string(),
  fanart: z.preprocess(
    (val) => ((val as { status: string }).status !== 'error' ? val : null),
    z.object({ movieposter: z.array(z.object({ url: z.string() })) }).nullable()
  ),
});

export class MovieStore extends BaseMediaStore<z.infer<typeof movieSchema>> {
  constructor() {
    super(
      movieSchema.parse,
      (meta) => [meta.title, meta.fanart?.movieposter?.[0]?.url ?? endpoints.tmdbImage(meta.poster_path)],
      config.MEDIA_PATH_MOVIES
    );
  }

  public getMovies = async (page: number, query: string | undefined) => {
    const [movies, image] = await this.getMediaSummary(page, (media) => {
      if (!query) return media;
      return new Fuse(media, { keys: ['meta.title'], threshold: 0.3 }).search(query).map((result) => result.item);
    });

    const titles = movies.map((movie) => movie.meta.title);
    return [titles, image] as const;
  };
}
