import { decodeBase64 } from '$lib/utils';
import { thumbHashToRGBA } from 'thumbhash';

/**
 * Renders a thumbnail onto a canvas from a base64 encoded hash.
 * @param canvas
 * @param param1 object containing the base64 encoded hash (base64Thumbhash: yourString)
 */
export function thumbhash(canvas: HTMLCanvasElement, { base64ThumbHash }: { base64ThumbHash: string }) {
  const render = (hash: string) => {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const { w, h, rgba } = thumbHashToRGBA(decodeBase64(hash));
      const pixels = ctx.createImageData(w, h);
      canvas.width = w;
      canvas.height = h;
      pixels.data.set(rgba);
      ctx.putImageData(pixels, 0, 0);
    }
  };

  render(base64ThumbHash);

  return {
    update({ base64ThumbHash: newHash }: { base64ThumbHash: string }) {
      render(newHash);
    },
  };
}
