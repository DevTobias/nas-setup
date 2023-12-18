import { EmbedBuilder, User } from 'discord.js';

import { endpoints } from '$endpoints';
import { Movie } from '$features/media/MovieStore';
import { trunc } from '$utils/trunc';

type Options = {
  title: string;
  progress: number;
};

export const createMovieEmbed = (movie: Movie, user: User, options?: Partial<Options>) => {
  const progress = options?.progress ?? 0;
  const filledBlocks = Math.floor((progress / movie.runtime) * 10);
  const progressBar = `${'🟩'.repeat(filledBlocks)}${'⬛'.repeat(10 - filledBlocks)}`;

  return new EmbedBuilder()
    .setColor('#e4a011')
    .setAuthor({ name: 'STREAMING KONSOLE', iconURL: user.displayAvatarURL(), url: endpoints.imdbMovie(movie.imdb_id) })
    .setTitle(options?.title ?? `<a:streaming:1186036751454720182> \`${movie.title} (${movie.release_date.getFullYear()})\``)
    .addFields(
      { name: '👤 Angefragt von', value: `<@${user.id}>`, inline: true },
      { name: '⏱️ Laufzeit', value: `${movie.runtime} Minuten`, inline: true },
      { name: '⭐ Bewertung', value: `${movie.vote_average.toFixed(2)} / 10`, inline: true }
    )
    .addFields(
      { name: ' ', value: `**${progress} ${progress === 1 ? 'Minute' : 'Minuten'}** geschaut`, inline: true },
      { name: ' ', value: progressBar, inline: true }
    )
    .setDescription(trunc(movie.overview, 300))
    .setImage(movie.fan_arts?.moviethumb ?? endpoints.tmdbImage(movie.backdrop_path));
};
