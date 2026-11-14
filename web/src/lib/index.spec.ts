import { cleanClass } from '#lib/index.ts';
import { describe, expect, it } from 'vitest';

describe('cleanClass', () => {
  it('flattens nested class arrays', () => {
    expect(cleanClass('class1', [['class2a', 'class2b'], 'class3'])).toBe('class1 class2a class2b class3');
  });
});
