import { Image, createCanvas } from '@napi-rs/canvas';

import { wrapCanvasText } from '$utils/image/wrapCanvasText';

export const createImageCard = async (
  title: string,
  thumbnail: { image: Image; width: number; height: number },
  renderText = false
) => {
  const borderRadius = 10;

  const { width, height, image } = thumbnail!;

  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');

  // Draw the rounded rectangle as a clipper
  context.beginPath();
  context.moveTo(borderRadius, 0);
  context.arcTo(width, 0, width, height, borderRadius);
  context.arcTo(width, height, 0, height, borderRadius);
  context.arcTo(0, height, 0, 0, borderRadius);
  context.arcTo(0, 0, width, 0, borderRadius);
  context.closePath();
  context.clip();

  // Draw the actual image
  context.drawImage(image, 0, 0, width, height);

  // Draw the gradient over the image from top to bottom
  const gradient = context.createLinearGradient(width / 2, 0, width / 2, height);
  gradient.addColorStop(0, '#00000022');
  gradient.addColorStop(1, '#000000BB');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  if (renderText) {
    // Draw the title on the bottom image
    let fontSize = 50;
    let lineHeight = fontSize + 5;
    context.fillStyle = '#ffffff';
    context.font = `bold ${fontSize}px Arial`;

    // Wrap the text and render it
    let wrappedText = wrapCanvasText(context, title, width);

    if (wrappedText.length > 2) {
      fontSize = 30;
      lineHeight = fontSize + 5;
      context.font = `bold ${fontSize}px Arial`;
      wrappedText = wrapCanvasText(context, title, width);
    }

    for (let j = 0; j < wrappedText.length; j += 1) {
      const line = wrappedText[j];
      const yPosition = j * lineHeight + height - fontSize - (wrappedText.length - 1) * lineHeight;
      const lineMetrics = context.measureText(line);
      context.fillText(line, width / 2 - lineMetrics.width / 2, yPosition, width);
    }
  }

  return [canvas, width, height] as const;
};
