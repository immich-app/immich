export function elementWiseMean(vectors: number[][]): number[] {
  if (vectors.length === 0) {
    throw new Error('Cannot compute mean of empty array');
  }
  const dim = vectors[0].length;
  const mean = Array.from<number>({ length: dim }).fill(0);
  for (const vec of vectors) {
    for (let i = 0; i < dim; i++) {
      mean[i] += vec[i];
    }
  }
  for (let i = 0; i < dim; i++) {
    mean[i] /= vectors.length;
  }
  return mean;
}
