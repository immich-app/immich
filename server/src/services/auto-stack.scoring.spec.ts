import { computeAutoStackScore } from 'src/services/auto-stack.scoring';
import { describe, expect, it } from 'vitest';

const weights = { size: 30, timeSpan: 20, continuity: 10, visual: 50, exposure: 10 };
const maxGapSeconds = 30;
const windowSeconds = 90;

const baseAssets = [
  { id: 'a1', originalFileName: 'IMG_0001.jpg', dateTimeOriginal: new Date('2020-01-01T00:00:00Z') },
  { id: 'a2', originalFileName: 'IMG_0002.jpg', dateTimeOriginal: new Date('2020-01-01T00:00:00Z') },
  { id: 'a3', originalFileName: 'IMG_0003.jpg', dateTimeOriginal: new Date('2020-01-01T00:00:00Z') },
];

describe('computeAutoStackScore', () => {
  it('CLIP-only: higher cosine similarity yields higher score', () => {
    const embSimilar: Record<string, number[]> = {
      a1: [1, 0, 0],
      a2: [0.99, 0.01, 0],
      a3: [0.98, 0.02, 0],
    };
    const embOrthogonal: Record<string, number[]> = {
      a1: [1, 0, 0],
      a2: [0, 1, 0],
      a3: [0, 0, 1],
    };

    const hi = computeAutoStackScore({
      assets: baseAssets,
      embeddingMap: embSimilar,
      weights,
      maxGapSeconds,
      windowSeconds,
    });
    const lo = computeAutoStackScore({
      assets: baseAssets,
      embeddingMap: embOrthogonal,
      weights,
      maxGapSeconds,
      windowSeconds,
    });

    expect(hi.avgCos).toBeGreaterThan(lo.avgCos ?? -1);
    expect(hi.components.visual).toBeGreaterThan(lo.components.visual);
    expect(hi.total).toBeGreaterThan(lo.total);
  });

  it('pHash-only: higher average pHash similarity yields higher score', () => {
    const similar = baseAssets.map((a) => ({ ...a, pHash: 'aaaaaaaaaaaaaaaa' }));
    const dissimilar = [
      { ...baseAssets[0], pHash: '0000000000000000' },
      { ...baseAssets[1], pHash: 'ffffffffffffffff' },
      { ...baseAssets[2], pHash: '0000000000000000' },
    ];

    const hi = computeAutoStackScore({ assets: similar, embeddingMap: {}, weights, maxGapSeconds, windowSeconds });
    const lo = computeAutoStackScore({ assets: dissimilar, embeddingMap: {}, weights, maxGapSeconds, windowSeconds });

    expect(hi.components.visual).toBeGreaterThan(lo.components.visual);
    expect(hi.total).toBeGreaterThan(lo.total);
  });

  it('blended: pHash adjusts CLIP-only score up or down (0.7 clip + 0.3 pHash)', () => {
    const emb: Record<string, number[]> = {
      a1: [1, 0, 0],
      a2: [0.99, 0.01, 0],
      a3: [0.98, 0.02, 0],
    };
    const noHashAssets = baseAssets.map((a) => ({ ...a, pHash: undefined as unknown as string | undefined }));
    const highHashAssets = baseAssets.map((a) => ({ ...a, pHash: 'aaaaaaaaaaaaaaaa' }));
    const lowHashAssets = [
      { ...baseAssets[0], pHash: '0000000000000000' },
      { ...baseAssets[1], pHash: 'ffffffffffffffff' },
      { ...baseAssets[2], pHash: '0000000000000000' },
    ];

    const clipOnly = computeAutoStackScore({
      assets: noHashAssets,
      embeddingMap: emb,
      weights,
      maxGapSeconds,
      windowSeconds,
    });
    const blendedHigh = computeAutoStackScore({
      assets: highHashAssets,
      embeddingMap: emb,
      weights,
      maxGapSeconds,
      windowSeconds,
    });
    const blendedLow = computeAutoStackScore({
      assets: lowHashAssets,
      embeddingMap: emb,
      weights,
      maxGapSeconds,
      windowSeconds,
    });

    // With strong pHash agreement, blended should be at least clip-only (rounding may tie)
    expect(blendedHigh.components.visual).toBeGreaterThanOrEqual(clipOnly.components.visual);
    expect(blendedHigh.total).toBeGreaterThanOrEqual(clipOnly.total);

    // With poor pHash agreement, blended should be at most clip-only (rounding may tie)
    expect(blendedLow.components.visual).toBeLessThanOrEqual(clipOnly.components.visual);
    expect(blendedLow.total).toBeLessThanOrEqual(clipOnly.total);
  });
});
