/**
 * Pool multiple CLIP visual embeddings (same model/dim) into one vector for storage in `smart_search`.
 * Inputs are the string values returned by the ML service (JSON arrays).
 */
export function parseClipEmbeddingString(s: string): number[] {
  const parsed = JSON.parse(s.trim()) as unknown;
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Invalid CLIP embedding');
  }
  const nums = parsed.map((v) => Number(v));
  if (nums.some((n) => !Number.isFinite(n))) {
    throw new Error('Invalid CLIP embedding values');
  }
  return nums;
}

export function averageL2NormalizeClipEmbeddings(embeddings: string[]): string {
  if (embeddings.length === 0) {
    throw new Error('No CLIP embeddings to average');
  }
  if (embeddings.length === 1) {
    return embeddings[0];
  }

  const vectors = embeddings.map(parseClipEmbeddingString);
  const dim = vectors[0].length;
  for (const v of vectors) {
    if (v.length !== dim) {
      throw new Error('CLIP embedding dimension mismatch');
    }
  }

  const mean = new Array<number>(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) {
      mean[i] += v[i];
    }
  }
  const n = vectors.length;
  for (let i = 0; i < dim; i++) {
    mean[i] /= n;
  }

  let sq = 0;
  for (let i = 0; i < dim; i++) {
    sq += mean[i] * mean[i];
  }
  const norm = Math.sqrt(sq);
  if (norm === 0) {
    return JSON.stringify(mean);
  }
  for (let i = 0; i < dim; i++) {
    mean[i] /= norm;
  }
  return JSON.stringify(mean);
}
