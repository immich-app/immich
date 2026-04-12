import { averageL2NormalizeClipEmbeddings, parseClipEmbeddingString } from 'src/utils/clip-embedding.util';

describe('clip-embedding.util', () => {
  describe('parseClipEmbeddingString', () => {
    it('should parse a JSON array string', () => {
      expect(parseClipEmbeddingString('[1,2,3]')).toEqual([1, 2, 3]);
    });

    it('should reject invalid input', () => {
      expect(() => parseClipEmbeddingString('{}')).toThrow();
    });
  });

  describe('averageL2NormalizeClipEmbeddings', () => {
    it('should return the only embedding unchanged', () => {
      const one = '[3,4]';
      expect(averageL2NormalizeClipEmbeddings([one])).toBe(one);
    });

    it('should average two vectors and L2-normalize', () => {
      // [1,0] and [1,0] -> mean [1,0] -> norm 1 -> [1,0]
      const a = averageL2NormalizeClipEmbeddings(['[1,0]', '[1,0]']);
      expect(JSON.parse(a)).toEqual([1, 0]);
    });

    it('should average orthogonal unit vectors to diagonal and normalize', () => {
      const a = averageL2NormalizeClipEmbeddings(['[1,0]', '[0,1]']);
      const v = JSON.parse(a) as number[];
      expect(v[0]).toBeCloseTo(1 / Math.sqrt(2), 6);
      expect(v[1]).toBeCloseTo(1 / Math.sqrt(2), 6);
    });
  });
});
