import { describe, expect, it } from '@jest/globals';
import { parseISO } from './iso';

describe('parsing ISO values', () => {
  it('returns null for invalid values', () => {
    expect(parseISO('')).toBeNull();
    expect(parseISO(',,,')).toBeNull();
    expect(parseISO('invalid')).toBeNull();
    expect(parseISO('-5')).toBeNull();
    expect(parseISO('99999999999999')).toBeNull();
  });

  it('returns the ISO number for valid inputs', () => {
    expect(parseISO('0.0')).toBe(0);
    expect(parseISO('32000.9')).toBe(32000);
  });

  it('returns the first valid ISO number in a comma separated list', () => {
    expect(parseISO('400, 200, 100')).toBe(400);
    expect(parseISO('-1600,800')).toBe(800);
    expect(parseISO('-1,   a., 1200')).toBe(1200);
    expect(parseISO('NaN,50,100')).toBe(50);
  });
});
