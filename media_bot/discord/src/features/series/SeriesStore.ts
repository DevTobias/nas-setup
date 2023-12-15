import fs from 'fs';
import path from 'path';

import Fuse from 'fuse.js';
import { globSync } from 'glob';

import { config } from '$config';
import { endpoints } from '$endpoints';
import { SeriesMetadata, seriesSchema } from '$features/series/MetadataSchema';
import { createImageGrid } from '$utils/image/createImageGrid';
import { generateThumbnail } from '$utils/image/generateThumbnail';
import { Thumbnail } from '$utils/models/thumbnail';

interface Series {
  meta: SeriesMetadata;
  thumbnail: Thumbnail;
}

export class SeriesStore {
  private _series: Series[] = [];

  private _cardPadding = 20;

  private _colAmount = 3;

  private _rowAmount = 3;

  private _bannerWidth = 400;

  private _bannerAspectRatio = 0.7;

  private _searchResults = 0;

  constructor() {
    this._loadSeries();
  }

  public get maxPages() {
    return Math.ceil(this._searchResults / (this._colAmount * this._rowAmount));
  }

  public get searchResults() {
    return this._searchResults;
  }

  public getSeries = async (page: number, query: string | undefined) => {
    let series: Series[] = this._series;

    // Filter movies if query is provided
    if (query) {
      series = new Fuse(series, { keys: ['meta.title'] }).search(query).map((result) => result.item);
    }

    this._searchResults = series.length;
    if (series.length === 0) return null;

    // Paginate search results
    const maxPerPage = this._colAmount * this._rowAmount;
    const pageStart = page * maxPerPage;
    const pageEnd = pageStart > series.length - 1 ? undefined : pageStart + maxPerPage;
    const paginated = series.slice(pageStart, pageEnd);

    // Generate image grid and get titles to return
    const image = await createImageGrid(
      paginated.map((movie) => movie.thumbnail),
      this._colAmount,
      this._rowAmount,
      this._cardPadding
    );
    const titles = paginated.map((movie) => movie.meta.name);

    return [titles, image] as const;
  };

  private _loadSeries = async () => {
    const metaFiles = globSync(path.join(config.MEDIA_PATH_SERIES, '**/.meta.json'));

    this._series = await Promise.all(
      metaFiles.map(async (metaFile) => {
        const meta = seriesSchema.parse(JSON.parse(fs.readFileSync(metaFile, 'utf-8')));
        const thumbnailPath = meta.fanart?.tvposter?.[0]?.url ?? endpoints.tmdbImage(meta.poster_path);
        const thumbnail = await generateThumbnail(thumbnailPath, meta.name, this._bannerWidth, this._bannerAspectRatio);
        return { meta, thumbnail };
      })
    );

    console.log(`Loaded ${this._series.length} tv shows`);
  };
}
