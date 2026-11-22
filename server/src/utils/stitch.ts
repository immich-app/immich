import sharp from 'sharp';

export type StitchMode = 'scroll' | 'panorama';

export interface RawImage {
  data: Buffer;
  width: number;
  height: number;
}

const MAX_DIM = 4096;
const MAX_IMAGES = 50;

/** Decode an image buffer to raw RGB, auto-rotated, capped at MAX_DIM. */
export async function decodeToRaw(input: Buffer): Promise<RawImage> {
  let img = sharp(input).rotate();
  const meta = await img.metadata();
  const w0 = meta.width ?? 0;
  const h0 = meta.height ?? 0;
  if (!w0 || !h0) {
    throw new Error('Cannot decode image');
  }
  const scale = Math.min(1, MAX_DIM / Math.max(w0, h0));
  if (scale < 1) {
    img = img.resize(Math.max(1, Math.round(w0 * scale)), Math.max(1, Math.round(h0 * scale)), { fit: 'fill' });
  }
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const channels = info.channels;
  const n = info.width * info.height;
  const rgb = Buffer.alloc(n * 3);
  for (let i = 0; i < n; i++) {
    rgb[i * 3] = data[i * channels];
    rgb[i * 3 + 1] = data[i * channels + 1];
    rgb[i * 3 + 2] = data[i * channels + 2];
  }
  return { data: rgb, width: info.width, height: info.height };
}

export async function encodeJpeg(raw: RawImage, quality = 92): Promise<Buffer> {
  return await sharp(raw.data, { raw: { width: raw.width, height: raw.height, channels: 3 } })
    .jpeg({ quality })
    .toBuffer();
}

function toGray(rgb: Buffer): Float32Array {
  const n = rgb.length / 3;
  const gray = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    gray[i] = 0.299 * rgb[i * 3] + 0.587 * rgb[i * 3 + 1] + 0.114 * rgb[i * 3 + 2];
  }
  return gray;
}

function cropGray(gray: Float32Array, srcW: number, x0: number, y0: number, w: number, h: number): Float32Array {
  const out = new Float32Array(w * h);
  for (let r = 0; r < h; r++) {
    out.set(gray.subarray((y0 + r) * srcW + x0, (y0 + r) * srcW + x0 + w), r * w);
  }
  return out;
}

function cropRgb(rgb: Buffer, srcW: number, x0: number, y0: number, w: number, h: number): Buffer {
  const out = Buffer.alloc(w * h * 3);
  for (let r = 0; r < h; r++) {
    rgb.copy(out, r * w * 3, ((y0 + r) * srcW + x0) * 3, ((y0 + r) * srcW + x0 + w) * 3);
  }
  return out;
}

/** Area-average downscale of a grayscale plane by integer factor s. */
function downscale(gray: Float32Array, w: number, h: number, s: number): { data: Float32Array; w: number; h: number } {
  const nw = Math.max(1, Math.floor(w / s));
  const nh = Math.max(1, Math.floor(h / s));
  const out = new Float32Array(nw * nh);
  for (let r = 0; r < nh; r++) {
    for (let c = 0; c < nw; c++) {
      let sum = 0;
      let n = 0;
      for (let dr = 0; dr < s && r * s + dr < h; dr++) {
        for (let dc = 0; dc < s && c * s + dc < w; dc++) {
          sum += gray[(r * s + dr) * w + c * s + dc];
          n++;
        }
      }
      out[r * nw + c] = sum / n;
    }
  }
  return { data: out, w: nw, h: nh };
}

/**
 * Mean absolute difference between a[dy:] and b[:H-dy], scored on content
 * pixels only (ink = brighter than 40) so empty areas don't fake the score.
 */
function scoreVertical(a: Float32Array, b: Float32Array, w: number, h: number, dy: number): number {
  const rows = h - dy;
  if (rows <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  let sum = 0;
  let n = 0;
  for (let r = 0; r < rows; r++) {
    const ba = (r + dy) * w;
    const bb = r * w;
    for (let c = 0; c < w; c++) {
      const x = a[ba + c];
      const y = b[bb + c];
      if (x > 40 || y > 40) {
        n++;
        sum += Math.abs(x - y);
      }
    }
  }
  const size = rows * w;
  if (n < size * 0.01) {
    return Number.POSITIVE_INFINITY;
  }
  return sum / n;
}

function argminVertical(
  a: Float32Array,
  b: Float32Array,
  w: number,
  h: number,
  lo: number,
  hi: number,
): number {
  let best = lo;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let k = lo; k <= hi; k++) {
    const s = scoreVertical(a, b, w, h, k);
    if (s < bestScore) {
      bestScore = s;
      best = k;
    }
  }
  return best;
}

/**
 * Vertical scroll stitch (port of the it-tools OpenCV stitcher):
 * detect static header/footer rows, match the scroll offset on content
 * pixels only (coarse-to-fine), then pick the seam per column-block by
 * voting so floating buttons/shadows don't duplicate.
 */
function stitchVertical(images: RawImage[]): RawImage {
  if (images.length < 2 || images.length > MAX_IMAGES) {
    throw new Error(`Need 2..${MAX_IMAGES} images`);
  }
  const h = Math.min(...images.map((im) => im.height));
  const w = Math.min(...images.map((im) => im.width));
  if (h < 64 || w < 64) {
    throw new Error('Images too small to stitch');
  }
  const rgbs = images.map((im) => cropRgb(im.data, im.width, 0, 0, w, h));
  const grays = rgbs.map((rgb) => toGray(rgb));

  // dynamic pixels = differ in at least one consecutive pair
  const diff = new Float32Array(w * h);
  for (let i = 0; i < grays.length - 1; i++) {
    const a = grays[i];
    const b = grays[i + 1];
    for (let p = 0; p < w * h; p++) {
      const d = Math.abs(a[p] - b[p]);
      if (d > diff[p]) {
        diff[p] = d;
      }
    }
  }
  const moving = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) {
    moving[p] = diff[p] > 25 ? 1 : 0;
  }
  const rowDyn = new Array<boolean>(h + 1).fill(false);
  for (let r = 0; r < h; r++) {
    let s = 0;
    for (let c = 0; c < w; c++) {
      s += moving[r * w + c];
    }
    rowDyn[r] = s / w > 0.02;
  }
  const dynCols: number[] = [];
  for (let c = 0; c < w; c++) {
    let s = 0;
    for (let r = 0; r < h; r++) {
      s += moving[r * w + c];
    }
    if (s / h > 0.02) {
      dynCols.push(c);
    }
  }

  // longest dynamic row run (allowing small gaps) = scroll region
  let y0 = 0;
  let y1 = h;
  {
    let start: number | null = null;
    let gap = 0;
    const tol = Math.max(1, Math.floor(h / 50));
    const close = (endY: number) => {
      if (start === null) {
        return;
      }
      const end = endY - gap;
      if (y0 === 0 && y1 === h) {
        y0 = start;
        y1 = end;
      } else if (end - start > y1 - y0) {
        y0 = start;
        y1 = end;
      }
    };
    for (let y = 0; y <= h; y++) {
      if (y < h && rowDyn[y]) {
        if (start === null) {
          start = y;
        }
        gap = 0;
      } else if (start !== null) {
        gap++;
        if (gap > tol || y === h) {
          close(y);
          start = null;
          gap = 0;
        }
      }
    }
  }
  const rh = y1 - y0;
  const x0 = dynCols.length > 0 ? dynCols[0] : 0;
  const x1 = dynCols.length > 0 ? dynCols[dynCols.length - 1] + 1 : w;

  if (rh < 32 || x1 - x0 < 32) {
    // degenerate band: plain vertical stack
    const out = Buffer.alloc(w * h * images.length * 3);
    rgbs.forEach((rgb, i) => rgb.copy(out, i * w * h * 3));
    return { data: out, width: w, height: h * images.length };
  }

  const regions = grays.map((g) => cropGray(g, w, x0, y0, x1 - x0, rh));
  const rw = x1 - x0;
  const s = 4;
  const small = regions.map((g) => downscale(g, rw, rh, s));
  const minOv = Math.max(8, Math.floor(rh / 10));

  const offsets: number[] = [];
  for (let i = 0; i < regions.length - 1; i++) {
    const a = small[i];
    const b = small[i + 1];
    const minOvS = Math.max(1, Math.floor(minOv / s));
    let d = argminVertical(a.data, b.data, a.w, a.h, 0, Math.max(0, a.h - minOvS)) * s;
    const A = regions[i];
    const B = regions[i + 1];
    d = argminVertical(A, B, rw, rh, Math.max(0, d - s), Math.min(rh - minOv, d + s));
    offsets.push(d);
  }

  const tops: number[] = [0];
  for (const d of offsets) {
    tops.push(tops[tops.length - 1] + d);
  }
  const total = tops[tops.length - 1] + rh;
  const reg = rgbs.map((rgb) => cropRgb(rgb, w, 0, y0, w, rh));

  // floating buttons/shadows are static on screen: blocks that disagree
  // between the two overlapping frames get penalized -> taken from the other frame
  const bw = 64;
  const nb = Math.ceil(w / bw);
  const votes = new Float32Array(rh * nb);
  for (let i = 0; i < offsets.length; i++) {
    const d = offsets[i];
    const a = reg[i];
    const b = reg[i + 1];
    for (let r = 0; r < rh - d; r++) {
      for (let blk = 0; blk < nb; blk++) {
        let bad = 0;
        for (let k = 0; k < bw; k++) {
          const c = blk * bw + k;
          if (c >= w) {
            break;
          }
          const pa = ((r + d) * w + c) * 3;
          const pb = (r * w + c) * 3;
          if (
            Math.abs(a[pa] - b[pb]) > 12 ||
            Math.abs(a[pa + 1] - b[pb + 1]) > 12 ||
            Math.abs(a[pa + 2] - b[pb + 2]) > 12
          ) {
            bad++;
          }
        }
        votes[(r + d) * nb + blk] += bad;
        votes[r * nb + blk] += bad;
      }
    }
  }
  // dilate 31x3
  const tmp = new Float32Array(rh * nb);
  for (let r = 0; r < rh; r++) {
    for (let c = 0; c < nb; c++) {
      let m = 0;
      for (let dc = -1; dc <= 1; dc++) {
        const cc = c + dc;
        if (cc >= 0 && cc < nb && votes[r * nb + cc] > m) {
          m = votes[r * nb + cc];
        }
      }
      tmp[r * nb + c] = m;
    }
  }
  const dil = new Float32Array(rh * nb);
  for (let r = 0; r < rh; r++) {
    for (let c = 0; c < nb; c++) {
      let m = 0;
      for (let dr = -15; dr <= 15; dr++) {
        const rr = r + dr;
        if (rr >= 0 && rr < rh && tmp[rr * nb + c] > m) {
          m = tmp[rr * nb + c];
        }
      }
      dil[r * nb + c] = m;
    }
  }
  // prefer the middle of the scroll region; edges catch header/footer shadows
  const pen = new Float32Array(rh);
  for (let r = 0; r < rh; r++) {
    pen[r] = Math.abs(r - rh / 2) / rh;
  }
  const edge = Math.floor(rh / 8);
  for (let r = 0; r < edge; r++) {
    pen[r] += 30;
    pen[rh - 1 - r] += 30;
  }

  const best = new Float32Array(total * nb).fill(Number.POSITIVE_INFINITY);
  const src = new Int32Array(total * nb);
  for (let i = 0; i < reg.length; i++) {
    for (let r = 0; r < rh; r++) {
      const R = tops[i] + r;
      for (let c = 0; c < nb; c++) {
        const cost = dil[r * nb + c] + pen[r];
        if (cost < best[R * nb + c]) {
          best[R * nb + c] = cost;
          src[R * nb + c] = i;
        }
      }
    }
  }
  const content = Buffer.alloc(total * w * 3);
  for (let i = 0; i < reg.length; i++) {
    const frame = reg[i];
    for (let r = 0; r < rh; r++) {
      const R = tops[i] + r;
      for (let blk = 0; blk < nb; blk++) {
        if (src[R * nb + blk] !== i) {
          continue;
        }
        for (let k = 0; k < bw; k++) {
          const c = blk * bw + k;
          if (c >= w) {
            break;
          }
          frame.copy(content, (R * w + c) * 3, (r * w + c) * 3, (r * w + c) * 3 + 3);
        }
      }
    }
  }

  const head = cropRgb(rgbs[0], w, 0, 0, w, y0);
  const tail = cropRgb(rgbs[rgbs.length - 1], w, 0, y1, w, h - y1);
  const outH = y0 + total + (h - y1);
  const out = Buffer.alloc(w * outH * 3);
  head.copy(out, 0);
  content.copy(out, y0 * w * 3);
  tail.copy(out, (y0 + total) * w * 3);
  return { data: out, width: w, height: outH };
}

function transposeImage(im: RawImage): RawImage {
  const { data, width: w, height: h } = im;
  const out = Buffer.alloc(w * h * 3);
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      data.copy(out, (c * h + r) * 3, (r * w + c) * 3, (r * w + c) * 3 + 3);
    }
  }
  return { data: out, width: h, height: w };
}

/** Panorama = same overlap/voting machinery on transposed frames (horizontal sweep). */
function stitchHorizontal(images: RawImage[]): RawImage {
  return transposeImage(stitchVertical(images.map(transposeImage)));
}

export async function stitchImages(inputs: Buffer[], mode: StitchMode): Promise<Buffer> {
  if (inputs.length < 2 || inputs.length > MAX_IMAGES) {
    throw new Error(`Send 2..${MAX_IMAGES} images`);
  }
  const raws = await Promise.all(inputs.map(decodeToRaw));
  const result = mode === 'panorama' ? stitchHorizontal(raws) : stitchVertical(raws);
  return await encodeJpeg(result);
}
