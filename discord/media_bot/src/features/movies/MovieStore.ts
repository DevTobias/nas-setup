import fs from 'fs';
import path from 'path';

import { globSync } from 'glob';

import { config } from '$config';
import { endpoints } from '$endpoints';
import { MovieMetadata, movieSchema } from '$features/movies/MetadataScheme';
import { createImageGrid } from '$utils/image/createImageGrid';
import { generateThumbnail } from '$utils/image/generateThumbnail';
import { Thumbnail } from '$utils/models/thumbnail';

interface Movie {
  file: string;
  meta: MovieMetadata;
  thumbnail: Thumbnail;
}

export class MovieStore {
  private _movies: Movie[] = [];

  private _cardPadding = 20;

  private _colAmount = 3;

  private _rowAmount = 3;

  private _bannerWidth = 400;

  private _bannerAspectRatio = 0.7;

  constructor() {
    this._loadMovies();
  }

  public get maxPages() {
    return Math.ceil(this._movies.length / (this._colAmount * this._rowAmount));
  }

  public getMovies = async (page: number) => {
    const maxPerPage = this._colAmount * this._rowAmount;
    const pageStart = page * maxPerPage;
    const pageEnd = pageStart > this._movies.length - 1 ? undefined : pageStart + maxPerPage;
    const paginatedMovies = this._movies.slice(pageStart, pageEnd);

    const image = await createImageGrid(
      paginatedMovies.map((movie) => movie.thumbnail),
      this._colAmount,
      this._rowAmount,
      this._cardPadding
    );

    const titles = paginatedMovies.map((movie) => movie.meta.title);

    return [titles, image] as const;
  };

  private _loadMovies = async () => {
    const metaFiles = globSync(path.join(config.MEDIA_PATH_MOVIES, '**/.meta.json'));

    this._movies = await Promise.all(
      metaFiles.map(async (metaFile) => {
        const file = globSync(path.join(path.dirname(metaFile), '*.@(mkv|mp4)'))[0];
        const meta = movieSchema.parse(JSON.parse(fs.readFileSync(metaFile, 'utf-8')));
        const thumbnailPath = meta.fanart?.movieposter?.[0]?.url ?? endpoints.tmdbImage(meta.poster_path);
        const thumbnail = await generateThumbnail(thumbnailPath, meta.title, this._bannerWidth, this._bannerAspectRatio);
        return { file, meta, thumbnail };
      })
    );

    console.log(`Loaded ${this._movies.length} movies`);
  };
}
