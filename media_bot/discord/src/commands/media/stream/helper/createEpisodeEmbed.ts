import { EmbedBuilder, User } from 'discord.js';

import { endpoints } from '$endpoints';
import { TvEpisode } from '$features/media/TvShowStore';
import { trunc } from '$utils/trunc';

type Options = {
  progress?: number;
  finished?: boolean;
  seasonNumber: number;
  fallbackDescription: string;
  fallbackBanner: string;
};

export const createEpisodeEmbed = (episode: TvEpisode, user: User, options: Options) => {
  const label = `S${options.seasonNumber.toString().padStart(2, '0')}E${episode.episode_number.toString().padStart(2, '0')}`;

  const progress = options?.progress ?? 0;
  const filledBlocks = Math.floor((progress / episode.runtime!) * 10);
  const progressBar = `${'🟩'.repeat(filledBlocks)}${'⬛'.repeat(10 - filledBlocks)}`;

  const finishedTitle = `Stream für \`${episode.name} (${label})\` beendet`;

  return new EmbedBuilder()
    .setColor('#e4a011')
    .setAuthor({ name: 'STREAMING KONSOLE', iconURL: user.displayAvatarURL() })
    .setTitle(options?.finished ? finishedTitle : `<a:streaming:1186036751454720182> \`${episode.name} (${label})\``)
    .addFields(
      { name: '👤 Angefragt von', value: `<@${user.id}>`, inline: true },
      { name: '⏱️ Laufzeit', value: `${episode.runtime} Minuten`, inline: true },
      { name: '⭐ Bewertung', value: `${episode.vote_average.toFixed(2)} / 10`, inline: true }
    )
    .addFields(
      { name: ' ', value: `**${progress} ${progress === 1 ? 'Minute' : 'Minuten'}** geschaut`, inline: true },
      { name: ' ', value: progressBar, inline: true }
    )
    .setDescription(trunc(episode.overview === '' ? episode.overview : options.fallbackDescription, 300))
    .setImage(episode.still_path ? endpoints.tmdbImage(episode.still_path) : options.fallbackBanner);
};
