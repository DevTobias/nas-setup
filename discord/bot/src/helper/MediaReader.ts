import { readdirSync } from 'fs';

export const getDirectories = (path: string) => {
  return readdirSync(path, 'utf8');
};

export const getVideoFiles = (path: string) => {
  return readdirSync(path, 'utf8').filter((file) => file.includes('.mkv') || file.includes('.mp4'));
};

export const getSeriesDetails = (path: string, seriesName: string) => {
  return getDirectories(`${path}/${seriesName}`).map((season) => {
    const episodes = getDirectories(`${path}/${seriesName}/${season}`).map((episode) => {
      const [, pos, ...title] = episode.split(' - ');
      const cleanedTitle = title.join(' ').replace('-1080p.mkv', '').replace('HDTV', '');
      return `${pos} ${cleanedTitle}`;
    });

    return `**${season} (${episodes.length} episodes)**\n      ${episodes.join('\n      ')}\n`;
  });
};

export const getMovieUrl = (path: string, movieName: string) => {
  const video = getVideoFiles(`${path}/${movieName}`)[0];
  return `${path}/${movieName}/${video}`;
};

export const getSeriesUrl = (path: string, position: string, seriesName: string) => {
  const [season, episode] = position
    .slice(1)
    .split('E')
    .map((e) => parseInt(e, 10));
  const video = getVideoFiles(`${path}/${seriesName}/Season ${season}`)[episode - 1];
  return `${path}/${seriesName}/Season ${season}/${video}`;
};
