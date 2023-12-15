import { SKRSContext2D } from '@napi-rs/canvas';

export const wrapCanvasText = (context: SKRSContext2D, text: string, maxWidth: number) => {
  const words = text.split(' ');
  let line = '';
  const lines = [];

  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    const testLine = line + (i > 0 ? ' ' : '') + word;
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && i > 0) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }

  lines.push(line);
  return lines;
};
