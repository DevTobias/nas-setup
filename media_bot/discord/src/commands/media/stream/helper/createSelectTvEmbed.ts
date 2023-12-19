import { EmbedBuilder, User } from 'discord.js';

import { endpoints } from '$endpoints';
import { TvShow } from '$features/media/TvShowStore';
import { trunc } from '$utils/trunc';

export const createSelectTvEmbed = (tv: TvShow, user: User) => {
  return new EmbedBuilder()
    .setColor('#e4a011')
    .setAuthor({ name: 'STREAMING KONSOLE', iconURL: user.displayAvatarURL(), url: endpoints.imdbMovie(tv.imdb_id) })
    .setTitle(`🔎 Episodenauswahl für \`${tv.name} (${tv.last_air_date.getFullYear()})\``)
    .addFields(
      { name: '👤 Angefragt von', value: `<@${user.id}>`, inline: true },
      { name: '⭐ Bewertung', value: `${tv.vote_average.toFixed(2)} / 10`, inline: true }
    )
    .setDescription(trunc(tv.overview, 300))
    .setImage(tv.fan_arts?.tvthumb ?? endpoints.tmdbImage(tv.backdrop_path));
};
