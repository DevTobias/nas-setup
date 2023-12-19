import { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';

import { TvShow } from '$features/media/TvShowStore';
import { trunc } from '$utils/trunc';

export const createSelectEpisodeActions = (season: TvShow['seasons'][number]) => {
  const availableEpisodes = season.episodes.filter((episode) => episode.file != null);

  const selectSeason = new StringSelectMenuBuilder()
    .setCustomId('episode')
    .setPlaceholder('Wähle die Episode aus, die du schauen möchtest.')
    .addOptions(
      availableEpisodes.map((episode) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(`${episode.episode_number} ${episode.name}`)
          .setValue(episode.episode_number.toString())
          .setDescription(episode.overview === '' ? trunc(episode.overview) : ' ')
      )
    );

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectSeason);
};
