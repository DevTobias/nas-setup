import { EmbedBuilder, User } from 'discord.js';

import { endpoints } from '$endpoints';
import { Movie } from '$features/media/MovieStore';
import { trunc } from '$utils/trunc';

export const createMovieEmbed = (movie: Movie, user: User) => {
  return new EmbedBuilder()
    .setColor('#e4a011')
    .setAuthor({ name: 'STREAMING KONSOLE', iconURL: user.displayAvatarURL(), url: endpoints.imdbMovie(movie.imdb_id) })
    .setTitle(`<a:streaming:1186036751454720182> \`${movie.title} (${movie.release_date.getFullYear()})\``)
    .addFields(
      { name: '👤 Angefragt von', value: `<@${user.id}>`, inline: true },
      { name: '⏱️ Laufzeit', value: `${movie.runtime} Minuten`, inline: true },
      { name: '⭐ Bewertung', value: `${movie.vote_average.toFixed(2)} / 10`, inline: true }
    )
    .setDescription(trunc(movie.overview, 300))
    .setImage(movie.fan_arts?.moviethumb ?? endpoints.tmdbImage(movie.backdrop_path));
};
