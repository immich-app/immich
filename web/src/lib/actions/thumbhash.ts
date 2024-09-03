import { decodeBase64 } from '$lib/utils';
import { thumbHashToRGBA } from 'thumbhash';

export function thumbhash(canvas: HTMLCanvasElement, { base64ThumbHash }: { base64ThumbHash: string }) {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const { w, h, rgba } = thumbHashToRGBA(decodeBase64(base64ThumbHash));
    const pixels = ctx.createImageData(w, h);
    canvas.width = w;
    canvas.height = h;
    pixels.data.set(rgba);
    ctx.putImageData(pixels, 0, 0);
  }
}
