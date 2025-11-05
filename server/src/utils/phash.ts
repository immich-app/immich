import sharp from 'sharp';

// 32x32 DCT size (standard pHash)
const N = 32;
// Precompute cosine terms for DCT
const dctCos: number[][] = Array.from({ length: N }, (_, u) =>
  Array.from({ length: N }, (_, x) => Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N))),
);
const c = (u: number) => (u === 0 ? Math.SQRT1_2 : 1);

function dct2(block: number[][]): number[][] {
  const out = Array.from({ length: N }, () => Array.from({ length: N }).fill(0)) as Array<Array<number>>;
  for (let u = 0; u < N; u++) {
    const cu = c(u);
    for (let v = 0; v < N; v++) {
      const cv = c(v);
      let sum = 0;
      for (let x = 0; x < N; x++) {
        const cx = dctCos[u][x];
        const row = block[x];
        for (let y = 0; y < N; y++) {
          sum += row[y] * cx * dctCos[v][y];
        }
      }
      out[u][v] = (2 / N) * cu * cv * sum;
    }
  }
  return out;
}

/**
 * Compute a 64‑bit perceptual hash (pHash) for an image file.
 * Returns 16 lowercase hex chars. Uses BigInt to preserve all 64 bits.
 */
export async function computePerceptualHash(path: string): Promise<string> {
  const { data } = await sharp(path)
    .greyscale()
    .resize(N, N, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const block = Array.from({ length: N }, () => Array.from({ length: N }).fill(0)) as number[][];
  for (let i = 0; i < data.length; i++) {
    block[Math.trunc(i / N)][i % N] = data[i];
  }
  const dct = dct2(block);

  // Top-left 8x8 low frequency coefficients
  const low: number[] = [];
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      low.push(dct[x][y]);
    }
  }
  // Median of AC terms (exclude DC at index 0)
  const ac = low.slice(1).sort((a, b) => a - b);
  const median = ac[Math.trunc(ac.length / 2)];

  let hash = 0n;
  for (let i = 0; i < 64; i++) {
    hash = (hash << 1n) | (low[i] > median ? 1n : 0n);
  }
  return hash.toString(16).padStart(16, '0');
}
