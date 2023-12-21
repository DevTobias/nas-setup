import { EmbedBuilder, User } from 'discord.js';

import { getProgressFields } from '$commands/media/stream/helper/embeds/getProgressFields';
import { endpoints } from '$endpoints';
import { TvEpisode, TvSeason, TvShow } from '$features/media/TvShowStore';
import { trunc } from '$utils/trunc';

type Options = {
  progressInMs?: number | undefined;
  finished?: boolean;
};

export const createEpisodeEmbed = (tv: TvShow, season: TvSeason, episode: TvEpisode, user: User, options?: Options) => {
  const progressFields = getProgressFields(options?.progressInMs, episode.runtime!);
  const label = `S${season.season_number.toString().padStart(2, '0')}E${episode.episode_number.toString().padStart(2, '0')}`;
  const finishedTitle = `Stream für \`${episode.name} (${label})\` beendet`;
  const fallbackBanner = tv.fan_arts?.tvthumb ?? tv.backdrop_path;

  const fallbackDescription = season.overview !== '' ? season.overview : tv.overview;
  const description = trunc(
    episode.overview !== '' ? episode.overview.split('\n')[0] : fallbackDescription.split('\n')[0],
    300
  );

  return new EmbedBuilder()
    .setColor('#e4a011')
    .setAuthor({ name: 'STREAMING KONSOLE', iconURL: user.displayAvatarURL() })
    .setTitle(options?.finished ? finishedTitle : `<a:streaming:1186036751454720182> \`${episode.name} (${label})\``)
    .addFields(
      { name: '📼 Serie', value: tv.name, inline: true },
      { name: '🚀 Folge', value: label, inline: true },
      { name: '🔥 Anzahl', value: tv.number_of_episodes.toString(), inline: true }
    )
    .addFields(
      { name: '👤 Angefragt von', value: `<@${user.id}>`, inline: true },
      { name: '⏱️ Laufzeit', value: `${episode.runtime} Minuten`, inline: true },
      { name: '⭐ Bewertung', value: `${episode.vote_average.toFixed(2)} / 10`, inline: true }
    )
    .addFields(progressFields)
    .setDescription(description)
    .setImage(episode.still_path ? endpoints.tmdbImage(episode.still_path) : fallbackBanner);
};
