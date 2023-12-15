import { loadImage } from '@napi-rs/canvas';
import axios from 'axios';
import sharp from 'sharp';

import { createImageCard } from '$utils/image/createImageCard';

export const generateThumbnail = async (url: string, title: string, width: number, ratio: number) => {
  const { data } = await axios.get(url, { responseType: 'arraybuffer' });

  const image = sharp(data);
  const height = Math.floor(width / ratio);

  const optimized = await image
    .resize({ width, height, fit: 'cover', position: sharp.strategy.entropy })
    .toFormat('jpeg', { quality: 10 })
    .toBuffer();

  return createImageCard(title, { image: await loadImage(optimized), width, height });
};
