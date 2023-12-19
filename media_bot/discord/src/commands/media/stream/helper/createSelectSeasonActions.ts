import { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';

import { TvShow } from '$features/media/TvShowStore';
import { trunc } from '$utils/trunc';

export const createSelectSeasonActions = (tv: TvShow) => {
  const availableSeasons = tv.seasons.filter((season) => season.missing_episodes !== season.episodes.length);

  const selectSeason = new StringSelectMenuBuilder()
    .setCustomId('season')
    .setPlaceholder('Wähle die Staffel aus, die du schauen möchtest.')
    .addOptions(
      availableSeasons.map((season) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(season.name)
          .setValue(season.season_number.toString())
          .setDescription(season.overview === '' ? trunc(tv.overview) : trunc(season.overview))
      )
    );

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectSeason);
};
