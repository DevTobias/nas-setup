import sharp from 'sharp';

import { Thumbnail } from '$features/media/models/thumbnail';

export const createImageGrid = async (images: Thumbnail[], rows: number, cols: number, gap: number) => {
  const actualRows = images.length < rows * cols ? Math.ceil(images.length / cols) : rows;
  const width = cols * (images[0][1] + gap) - gap;
  const height = actualRows * (images[0][2] + gap) - gap;

  const combinedImage = sharp({ create: { width, height, channels: 4, background: { r: 43, g: 45, b: 49 } } }).jpeg({
    quality: 10,
  });

  const compositions = images.map(([input, imgWidth, imgHeight], i) => {
    return { input, left: (i % cols) * (imgWidth + gap), top: Math.floor(i / rows) * (imgHeight + gap) };
  });

  return combinedImage.composite(compositions).toBuffer();
};
