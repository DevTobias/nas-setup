import fs from 'fs';
import path from 'path';

import { globSync } from 'glob';

import { createImageGrid } from '$utils/image/createImageGrid';
import { generateThumbnail } from '$utils/image/generateThumbnail';
import { Thumbnail } from '$utils/models/thumbnail';

type Media<M> = { meta: M; thumbnail: Thumbnail };

const cardPadding = 20;
const colAmount = 3;
const rowAmount = 3;
const bannerWidth = 400;
const bannerAspectRatio = 0.7;

export class BaseMediaStore<M> {
  protected media: Media<M>[] = [];

  public searchResults = 0;

  constructor(
    private _metaParser: (obj: unknown) => M,
    private _thumbnailLoader: (obj: M) => [string, string],
    private _mediaPath: string
  ) {
    this._loadMovies();
  }

  public get maxPages() {
    return Math.ceil(this.searchResults / (colAmount * rowAmount));
  }

  public getMediaSummary = async (page: number, filter: (media: Media<M>[]) => Media<M>[]) => {
    const movies = filter(this.media);

    this.searchResults = movies.length;
    if (movies.length === 0) return [[], null] as const;

    const maxPerPage = colAmount * rowAmount;
    const pageStart = page * maxPerPage;
    const pageEnd = pageStart > movies.length - 1 ? undefined : pageStart + maxPerPage;
    const paginated = movies.slice(pageStart, pageEnd);

    const thumbnails = paginated.map((movie) => movie.thumbnail);
    const image = await createImageGrid(thumbnails, colAmount, rowAmount, cardPadding);

    return [paginated, image] as const;
  };

  private _loadMovies = async () => {
    const metaFiles = globSync(path.join(this._mediaPath, '**/.meta.json'));

    this.media = await Promise.all(
      metaFiles.map(async (metaFile) => {
        const meta = this._metaParser(JSON.parse(fs.readFileSync(metaFile, 'utf-8')));
        const [title, url] = this._thumbnailLoader(meta);
        const thumbnail = await generateThumbnail(url, title, bannerWidth, bannerAspectRatio);
        return { meta, thumbnail };
      })
    );

    console.log(`Loaded ${this.media.length} media files`);
  };
}
