export const getProgressFields = (progressInMs: number | undefined, runtime: number) => {
  const totalSeconds = Math.floor((progressInMs ?? 0) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const filledBlocks = Math.floor((minutes / runtime) * 10);
  const progressBar = `${'🟩'.repeat(filledBlocks)}${'⬛'.repeat(10 - filledBlocks)}`;
  const progressLabel = `**${minutes}m ${seconds}s** geschaut`;

  return [
    { name: ' ', value: progressLabel, inline: true },
    { name: ' ', value: progressBar, inline: true },
  ];
};
