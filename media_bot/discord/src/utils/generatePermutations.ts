export const generatePermutations = (rows: number, columns: number) => {
  const permutations = [];

  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < columns; j += 1) {
      permutations.push([i, j]);
    }
  }

  return permutations;
};
