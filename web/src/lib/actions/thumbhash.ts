import { decodeBase64 } from '$lib/utils';
import { thumbHashToRGBA } from 'thumbhash';

/**
 * Renders a thumbnail onto a canvas from a base64 encoded hash.
 */
export function thumbhash(canvas: HTMLCanvasElement, options: { base64ThumbHash: string }) {
  render(canvas, options);

  return {
    update(newOptions: { base64ThumbHash: string }) {
      render(canvas, newOptions);
    },
  };
}

const render = (canvas: HTMLCanvasElement, options: { base64ThumbHash: string }) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  const { w, h, rgba } = thumbHashToRGBA(decodeBase64(options.base64ThumbHash));
  const pixels = ctx.createImageData(w, h);
  canvas.width = w;
  canvas.height = h;
  pixels.data.set(rgba);
  ctx.putImageData(pixels, 0, 0);
};
