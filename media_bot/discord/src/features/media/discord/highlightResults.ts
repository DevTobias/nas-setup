export const highlightResults = (results: string[], key: string | null | undefined) => {
  return results.map((result) => (key ? result.replace(new RegExp(key, 'gi'), `**${key}**`) : result));
};
