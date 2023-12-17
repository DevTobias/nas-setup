import { Client } from 'discord.js';

import { MovieStore } from '$features/media/MovieStore';
import { TvShowStore } from '$features/media/TvShowStore';

export class MediaClient extends Client {
  tvShowStore: TvShowStore = new TvShowStore();

  movieStore: MovieStore = new MovieStore();
}
