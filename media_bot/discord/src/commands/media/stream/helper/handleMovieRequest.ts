import { CommandInteraction } from 'discord.js';

import { createMediaControlButtons } from '$features/media/discord/createMediaControlButtons';
import { createMovieEmbed } from '$features/media/discord/createMovieEmbed';
import { Movie } from '$features/media/MovieStore';

export const handleMovieRequest = (
  interaction: CommandInteraction,
  { actions }: ReturnType<typeof createMediaControlButtons>,
  movie: Movie
) => {
  const movieEmbed = createMovieEmbed(movie, interaction.user);
  return interaction.reply({ embeds: [movieEmbed], components: [actions as never] });
};
