import { EmbedBuilder, User } from 'discord.js';

import { getProgressFields } from '$commands/media/stream/helper/embeds/getProgressFields';
import { emotes } from '$config';
import { endpoints } from '$endpoints';
import { Movie } from '$features/media/MovieStore';
import { trunc } from '$utils/trunc';

type Options = {
  progressInMs?: number | undefined;
  finished?: boolean;
};

export const createMovieEmbed = (movie: Movie, user: User, options?: Options) => {
  const progressFields = getProgressFields(options?.progressInMs, movie.runtime);
  const finishedTitle = `Stream für \`${movie.title} (${movie.release_date.getFullYear()})\` beendet`;

  return new EmbedBuilder()
    .setColor('#e4a011')
    .setAuthor({ name: 'STREAMING KONSOLE', iconURL: user.displayAvatarURL(), url: endpoints.imdbMovie(movie.imdb_id) })
    .setTitle(options?.finished ? finishedTitle : `${emotes.live} \`${movie.title} (${movie.release_date.getFullYear()})\``)
    .addFields(
      { name: '👤 Angefragt von', value: `<@${user.id}>`, inline: true },
      { name: '⏱️ Laufzeit', value: `${movie.runtime} Minuten`, inline: true },
      { name: '⭐ Bewertung', value: `${movie.vote_average.toFixed(2)} / 10`, inline: true }
    )
    .addFields(progressFields)
    .setDescription(trunc(movie.overview, 300))
    .setImage(movie.fan_arts?.moviethumb ?? endpoints.tmdbImage(movie.backdrop_path));
};
