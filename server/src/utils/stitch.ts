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
 * Harris corner seeds on downscaled gray (text gives abundant strong corners).
 * Returns up to maxPoints points, min ~6px apart.
 */
function harrisCorners(gray: Float32Array, w: number, h: number, maxPoints: number): { x: number; y: number }[] {
  const ix = new Float32Array(w * h);
  const iy = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      ix[p] = gray[p + 1] - gray[p - 1];
      iy[p] = gray[p + w] - gray[p - w];
    }
  }
  const blur = (src: Float32Array): Float32Array => {
    const out = new Float32Array(w * h);
    for (let y = 2; y < h - 2; y++) {
      for (let x = 2; x < w - 2; x++) {
        let s = 0;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            s += src[(y + dy) * w + x + dx];
          }
        }
        out[y * w + x] = s / 25;
      }
    }
    return out;
  };
  const ixx = new Float32Array(w * h);
  const iyy = new Float32Array(w * h);
  const ixy = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    ixx[i] = ix[i] * ix[i];
    iyy[i] = iy[i] * iy[i];
    ixy[i] = ix[i] * iy[i];
  }
  const bxx = blur(ixx);
  const byy = blur(iyy);
  const bxy = blur(ixy);
  const cell = 6;
  const gw = Math.ceil(w / cell);
  const gh = Math.ceil(h / cell);
  const bestR = new Float32Array(gw * gh);
  const bestX = new Int32Array(gw * gh);
  const bestY = new Int32Array(gw * gh);
  for (let y = 3; y < h - 3; y++) {
    for (let x = 3; x < w - 3; x++) {
      const p = y * w + x;
      const det = bxx[p] * byy[p] - bxy[p] * bxy[p];
      const tr = bxx[p] + byy[p];
      const r = det - 0.04 * tr * tr;
      if (r <= 0) {
        continue;
      }
      const c = Math.floor(y / cell) * gw + Math.floor(x / cell);
      if (r > bestR[c]) {
        bestR[c] = r;
        bestX[c] = x;
        bestY[c] = y;
      }
    }
  }
  const pts: { x: number; y: number; r: number }[] = [];
  let rmax = 0;
  for (let c = 0; c < gw * gh; c++) {
    if (bestR[c] > rmax) {
      rmax = bestR[c];
    }
  }
  for (let c = 0; c < gw * gh; c++) {
    if (bestR[c] > rmax * 0.01) {
      pts.push({ x: bestX[c], y: bestY[c], r: bestR[c] });
    }
  }
  pts.sort((p, q) => q.r - p.r);
  return pts.slice(0, maxPoints);
}

/** Zero-mean normalized cross-correlation of (2*rad+1)^2 patches. -2 when flat. */
function patchNcc(
  a: Float32Array,
  aw: number,
  ah: number,
  ax: number,
  ay: number,
  b: Float32Array,
  bw: number,
  bh: number,
  bx: number,
  by: number,
  rad: number,
): number {
  const n = (2 * rad + 1) * (2 * rad + 1);
  let ma = 0;
  let mb = 0;
  for (let dy = -rad; dy <= rad; dy++) {
    for (let dx = -rad; dx <= rad; dx++) {
      ma += a[(ay + dy) * aw + ax + dx];
      mb += b[(by + dy) * bw + bx + dx];
    }
  }
  ma /= n;
  mb /= n;
  let sab = 0;
  let saa = 0;
  let sbb = 0;
  for (let dy = -rad; dy <= rad; dy++) {
    for (let dx = -rad; dx <= rad; dx++) {
      const da = a[(ay + dy) * aw + ax + dx] - ma;
      const db = b[(by + dy) * bw + bx + dx] - mb;
      sab += da * db;
      saa += da * da;
      sbb += db * db;
    }
  }
  if (saa < 1e-6 || sbb < 1e-6) {
    return -2;
  }
  return sab / Math.sqrt(saa * sbb);
}

/**
 * Robust scroll offset via corner matching + consensus vote.
 * Corners come from dynamic screen rows only (static chrome and static
 * overlays can't vote), each corner votes its best vertical match;
 * repetitive content scatters wrong votes while the true translation
 * piles up. Returns null when nothing reaches consensus.
 * Works on s=2 grids; the returned offset is in full-res pixels.
 */
function ransacOffset(
  a: Float32Array,
  b: Float32Array,
  w: number,
  h: number,
  dynS: Uint8Array,
  minOv: number,
): number | null {
  const corners = harrisCorners(b, w, h, 150).filter((p) => p.y < h && dynS[p.y]);
  if (corners.length < 12) {
    return null;
  }
  const maxDy = Math.max(0, h - minOv);
  const rad = 3;
  const votes: number[] = [];
  for (const p of corners) {
    if (p.x - rad - 2 < 0 || p.x + rad + 2 >= w || p.y - rad < 0 || p.y + rad >= h) {
      continue;
    }
    let bestNcc = 0.75;
    let bestDy = -1;
    for (let dy = 0; dy <= maxDy; dy++) {
      const ay = p.y + dy;
      if (ay - rad < 0 || ay + rad >= h) {
        break;
      }
      for (let dx = -2; dx <= 2; dx++) {
        const ncc = patchNcc(a, w, h, p.x + dx, ay, b, w, h, p.x, p.y, rad);
        if (ncc > bestNcc) {
          bestNcc = ncc;
          bestDy = dy;
        }
      }
    }
    if (bestDy >= 0) {
      votes.push(bestDy);
    }
  }
  if (votes.length < 12) {
    return null;
  }
  const bin = 2;
  const hist = new Map<number, number>();
  for (const v of votes) {
    const k = Math.round(v / bin);
    hist.set(k, (hist.get(k) ?? 0) + 1);
  }
  let peak = 0;
  let peakN = 0;
  for (const [k, n] of hist) {
    if (n > peakN) {
      peakN = n;
      peak = k;
    }
  }
  if (peakN < Math.max(12, votes.length * 0.15)) {
    return null;
  }
  const inliers = votes.filter((v) => Math.abs(v - peak * bin) <= 6);
  inliers.sort((x, y) => x - y);
  return inliers[Math.floor(inliers.length / 2)] * 2;
}

/**
 * Mean absolute difference between a[dy:] and b[:-dy], scored on content
 * pixels only (ink = brighter than 40) and only on rows marked dynamic in
 * `dynRows` (screen coords of b). Static chrome rows are excluded so they
 * can't outvote the true offset. Returns Inf when too few dynamic rows
 * overlap (near-identical frames).
 */
function maskedScore(
  a: Float32Array,
  b: Float32Array,
  w: number,
  h: number,
  dynRows: Uint8Array,
  dy: number,
  minOv: number,
): number {
  if (dy < 0 || dy >= h) {
    return Number.POSITIVE_INFINITY;
  }
  let sum = 0;
  let n = 0;
  let rows = 0;
  for (let r = 0; r < h - dy; r++) {
    if (!dynRows[r]) {
      continue;
    }
    rows++;
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
  if (rows < minOv || n < 100) {
    return Number.POSITIVE_INFINITY;
  }
  return sum / n;
}

function argminMasked(
  a: Float32Array,
  b: Float32Array,
  w: number,
  h: number,
  dynRows: Uint8Array,
  lo: number,
  hi: number,
  minOv: number,
): number {
  let best = lo;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let k = lo; k <= hi; k++) {
    const s = maskedScore(a, b, w, h, dynRows, k, minOv);
    if (s < bestScore) {
      bestScore = s;
      best = k;
    }
  }
  // no valid overlap (near-identical frames): keep stacked
  return Number.isFinite(bestScore) ? best : 0;
}

/**
 * Vertical scroll stitch: edge-trim static chrome, match scroll offsets with
 * masked SAD (static rows excluded) seeded by Harris-corner consensus
 * (RANSAC-style vote, immune to repetitive content), then pick the seam per
 * column block by screen-space overlay mask + inter-frame agreement so
 * floating buttons and shadows don't duplicate.
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
  // Trim static chrome anchored at the top/bottom edges only. Interior
  // blank rows are harmless for matching; splitting the band on them
  // (longest-run) fragments it when big scroll steps align the blanks.
  let y0 = 0;
  let y1 = h;
  for (let y = 0; y < h; y++) {
    if (rowDyn[y] && hasNeighbor(rowDyn, y, 1)) {
      y0 = y;
      break;
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    if (rowDyn[y] && hasNeighbor(rowDyn, y, -1)) {
      y1 = y + 1;
      break;
    }
  }
  function hasNeighbor(rows: boolean[], y: number, dir: 1 | -1): boolean {
    for (let k = 1; k <= 6; k++) {
      const yy = y + dir * k;
      if (yy < 0 || yy > h) {
        break;
      }
      if (yy < h && rows[yy]) {
        return true;
      }
    }
    return false;
  }
  const rh = y1 - y0;

  if (rh < 32) {
    // degenerate band: plain vertical stack
    const out = Buffer.alloc(w * h * images.length * 3);
    rgbs.forEach((rgb, i) => rgb.copy(out, i * w * h * 3));
    return { data: out, width: w, height: h * images.length };
  }

  const s = 4;
  const smallFull = grays.map((g) => downscale(g, w, h, s));
  const sw = smallFull[0].w;
  const sh = smallFull[0].h;
  const minOv = Math.max(8, Math.floor(h / 10));

  // Per-pair dynamic row masks (screen coords): rows that actually changed
  // between the two frames. Static chrome is masked out of matching so it
  // can't drag the match toward dy=0, and coincidentally-blank rows carry
  // no weight instead of fragmenting the band.
  const pairDyn: Uint8Array[] = [];
  const pairDynSmall: Uint8Array[] = [];
  for (let i = 0; i < grays.length - 1; i++) {
    const ga = grays[i];
    const gb = grays[i + 1];
    const dyn = new Uint8Array(h);
    for (let r = 0; r < h; r++) {
      let m = 0;
      for (let c = 0; c < w; c++) {
        if (Math.abs(ga[r * w + c] - gb[r * w + c]) > 25) {
          m++;
        }
      }
      dyn[r] = m / w > 0.02 ? 1 : 0;
    }
    const dynS = new Uint8Array(sh);
    for (let r = 0; r < sh; r++) {
      for (let dr = 0; dr < s && r * s + dr < h; dr++) {
        if (dyn[r * s + dr]) {
          dynS[r] = 1;
          break;
        }
      }
    }
    pairDyn.push(dyn);
    pairDynSmall.push(dynS);
  }

  const s2 = 2;
  const small2 = grays.map((g) => downscale(g, w, h, s2));
  const minOv2 = Math.max(4, Math.floor(minOv / s2));
  // s=2 dynamic masks for RANSAC corner selection
  const pairDyn2: Uint8Array[] = pairDyn.map((dyn) => {
    const sh2 = Math.ceil(h / s2);
    const m = new Uint8Array(sh2);
    for (let r = 0; r < sh2; r++) {
      for (let dr = 0; dr < s2 && r * s2 + dr < h; dr++) {
        if (dyn[r * s2 + dr]) {
          m[r] = 1;
          break;
        }
      }
    }
    return m;
  });

  const offsets: number[] = [];
  for (let i = 0; i < grays.length - 1; i++) {
    // robust feature consensus first; masked SAD coarse search as fallback
    let d = ransacOffset(
      small2[i].data,
      small2[i + 1].data,
      small2[i].w,
      small2[i].h,
      pairDyn2[i],
      minOv2,
    );
    if (d === null) {
      const minOvS = Math.max(2, Math.floor(minOv / s));
      d =
        argminMasked(
          smallFull[i].data,
          smallFull[i + 1].data,
          sw,
          sh,
          pairDynSmall[i],
          0,
          Math.max(0, sh - minOvS),
          minOvS,
        ) * s;
    }
    d = argminMasked(
      grays[i],
      grays[i + 1],
      w,
      h,
      pairDyn[i],
      Math.max(0, d - 8),
      Math.min(h - minOv, d + 8),
      minOv,
    );
    offsets.push(d);
  }

  const tops: number[] = [0];
  for (const d of offsets) {
    tops.push(tops[tops.length - 1] + d);
  }
  const total = tops[tops.length - 1] + rh;
  const reg = rgbs.map((rgb) => cropRgb(rgb, w, 0, y0, w, rh));

  // Overlay mask in screen space: UI that stays fixed on screen while
  // content scrolls (floating scroll button, sticky bars) matches across
  // consecutive frames at the same screen pixels, scrolling text doesn't.
  // Measured on downscaled gray so translucent edges still count.
  const bw = 64;
  const nb = Math.ceil(w / bw);
  const os = 4;
  const ow = smallFull[0].w;
  const oh = smallFull[0].h;
  const ovSmall = new Float32Array(ow * oh);
  for (let i = 0; i < smallFull.length - 1; i++) {
    const a = smallFull[i].data;
    const b = smallFull[i + 1].data;
    // <=48 catches translucent overlays; scrolled text differs by ~200
    for (let p = 0; p < ow * oh; p++) {
      if (Math.abs(a[p] - b[p]) <= 48) {
        ovSmall[p]++;
      }
    }
  }
  const npairs = smallFull.length - 1;
  for (let p = 0; p < ow * oh; p++) {
    ovSmall[p] /= npairs;
  }
  const ovBand = new Float32Array(rh * nb);
  for (let r = 0; r < rh; r++) {
    const sy0 = Math.floor((y0 + r) / os);
    const sy1 = Math.min(oh, Math.floor((y0 + r) / os) + 1);
    for (let blk = 0; blk < nb; blk++) {
      const sx0 = Math.floor((blk * bw) / os);
      const sx1 = Math.min(ow, Math.floor(((blk + 1) * bw) / os) + 1);
      let sum = 0;
      let n = 0;
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          sum += ovSmall[sy * ow + sx];
          n++;
        }
      }
      ovBand[r * nb + blk] = n ? sum / n : 0;
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

  // Per content row + column block, pick the covering frame with the least
  // screen-space overlay, then the best agreement with the other covering
  // frames (outlier overlay loses the vote), then the most central row.
  const src = new Int32Array(total * nb);
  for (let R = 0; R < total; R++) {
    for (let blk = 0; blk < nb; blk++) {
      const blkW = Math.min(bw, w - blk * bw);
      let bestScore = Number.POSITIVE_INFINITY;
      let bestI = -1;
      for (let i = 0; i < reg.length; i++) {
        const r = R - tops[i];
        if (r < 0 || r >= rh) {
          continue;
        }
        let agree = 0;
        let cnt = 0;
        for (let j = 0; j < reg.length; j++) {
          if (j === i) {
            continue;
          }
          const rj = R - tops[j];
          if (rj < 0 || rj >= rh) {
            continue;
          }
          const A = reg[i];
          const B = reg[j];
          const base = blk * bw;
          let m = 0;
          for (let k = 0; k < blkW; k++) {
            const pa = (r * w + base + k) * 3;
            const pb = (rj * w + base + k) * 3;
            if (
              Math.abs(A[pa] - B[pb]) <= 12 &&
              Math.abs(A[pa + 1] - B[pb + 1]) <= 12 &&
              Math.abs(A[pa + 2] - B[pb + 2]) <= 12
            ) {
              m++;
            }
          }
          agree += m / blkW;
          cnt++;
        }
        const agreeFrac = cnt > 0 ? agree / cnt : 1;
        const score = ovBand[r * nb + blk] * 2 - agreeFrac + pen[r] * 0.02;
        if (score < bestScore) {
          bestScore = score;
          bestI = i;
        }
      }
      src[R * nb + blk] = bestI;
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
