import { createCanvas } from '@napi-rs/canvas';

import { generatePermutations } from '$utils/generatePermutations';
import { Thumbnail } from '$utils/models/thumbnail';

export const createImageGrid = (images: Thumbnail[], rows: number, cols: number, gap: number) => {
  const actualRows = images.length < rows * cols ? Math.ceil(images.length / cols) : rows;

  const canvasHeight = actualRows * (images[0][2] + gap);
  const canvasWidth = cols * (images[0][1] + gap);
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const context = canvas.getContext('2d');

  generatePermutations(actualRows, cols).forEach(([i, j]) => {
    const cardIndex = i * cols + j;
    if (cardIndex < images.length) {
      const [card, width, height] = images[cardIndex];
      context.drawImage(card, j * (width + gap), i * (height + gap));
    }
  });

  return canvas.encode('png');
};
