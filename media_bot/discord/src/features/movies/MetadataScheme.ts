import { z } from 'zod';

const genreSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const productionCompanySchema = z.object({
  id: z.number(),
  logo_path: z.string().nullable(),
  name: z.string(),
  origin_country: z.string(),
});

const productionCountrySchema = z.object({
  iso_3166_1: z.string(),
  name: z.string(),
});

const spokenLanguageSchema = z.object({
  english_name: z.string(),
  iso_639_1: z.string(),
  name: z.string(),
});

const hdmovielogoSchema = z.object({
  id: z.string(),
  url: z.string(),
  lang: z.string(),
  likes: z.string(),
});

const movieposterSchema = z.object({
  id: z.string(),
  url: z.string(),
  lang: z.string(),
  likes: z.string(),
});

const hdmovieclearartSchema = z.object({
  id: z.string(),
  url: z.string(),
  lang: z.string(),
  likes: z.string(),
});

const moviethumbSchema = z.object({
  id: z.string(),
  url: z.string(),
  lang: z.string(),
  likes: z.string(),
});

const moviebackgroundSchema = z.object({
  id: z.string(),
  url: z.string(),
  lang: z.string(),
  likes: z.string(),
});

const moviediscSchema = z.object({
  id: z.string(),
  url: z.string(),
  lang: z.string(),
  likes: z.string(),
  disc: z.string(),
  disc_type: z.string(),
});

const moviebannerSchema = z.object({
  id: z.string(),
  url: z.string(),
  lang: z.string(),
  likes: z.string(),
});

const fanartSchema = z.object({
  name: z.string(),
  tmdb_id: z.string(),
  imdb_id: z.string(),
  hdmovielogo: z.array(hdmovielogoSchema),
  movieposter: z.array(movieposterSchema),
  hdmovieclearart: z.array(hdmovieclearartSchema).optional(),
  moviethumb: z.array(moviethumbSchema),
  moviebackground: z.array(moviebackgroundSchema),
  moviedisc: z.array(moviediscSchema),
  moviebanner: z.array(moviebannerSchema),
});

export const movieSchema = z.object({
  adult: z.boolean(),
  backdrop_path: z.string(),
  belongs_to_collection: z.unknown().nullable(),
  budget: z.number(),
  genres: z.array(genreSchema),
  homepage: z.string(),
  id: z.number(),
  imdb_id: z.string(),
  original_language: z.string(),
  original_title: z.string(),
  overview: z.string(),
  popularity: z.number(),
  poster_path: z.string(),
  production_companies: z.array(productionCompanySchema),
  production_countries: z.array(productionCountrySchema),
  release_date: z.string(),
  revenue: z.number(),
  runtime: z.number(),
  spoken_languages: z.array(spokenLanguageSchema),
  status: z.string(),
  tagline: z.string(),
  title: z.string(),
  video: z.boolean(),
  vote_average: z.number(),
  vote_count: z.number(),
  fanart: z.preprocess((val) => ((val as { status: string }).status !== 'error' ? val : null), fanartSchema.nullable()),
});

export type MovieMetadata = z.infer<typeof movieSchema>;
