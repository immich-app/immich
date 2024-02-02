import { parseLatitude, parseLongitude } from './coordinates';

describe('parsing latitude from string input', () => {
  it('returns null for invalid inputs', () => {
    expect(parseLatitude('')).toBeNull();
    expect(parseLatitude('NaN')).toBeNull();
    expect(parseLatitude('Infinity')).toBeNull();
    expect(parseLatitude('-Infinity')).toBeNull();
    expect(parseLatitude('90.001')).toBeNull();
    expect(parseLatitude(-90.000_001)).toBeNull();
    expect(parseLatitude('1000')).toBeNull();
    expect(parseLatitude(-1000)).toBeNull();
  });

  it('returns the numeric coordinate for valid inputs', () => {
    expect(parseLatitude('90')).toBeCloseTo(90);
    expect(parseLatitude('-90')).toBeCloseTo(-90);
    expect(parseLatitude(89.999_999)).toBeCloseTo(89.999_999);
    expect(parseLatitude('-89.9')).toBeCloseTo(-89.9);
    expect(parseLatitude(0)).toBeCloseTo(0);
    expect(parseLatitude('-0.0')).toBeCloseTo(-0);
  });
});

describe('parsing latitude from null input', () => {
  it('returns null for null input', () => {
    expect(parseLatitude(null)).toBeNull();
  });
});

describe('parsing longitude from string input', () => {
  it('returns null for invalid inputs', () => {
    expect(parseLongitude('')).toBeNull();
    expect(parseLongitude('NaN')).toBeNull();
    expect(parseLongitude(Number.POSITIVE_INFINITY)).toBeNull();
    expect(parseLongitude('-Infinity')).toBeNull();
    expect(parseLongitude('180.001')).toBeNull();
    expect(parseLongitude('-180.000001')).toBeNull();
    expect(parseLongitude(1000)).toBeNull();
    expect(parseLongitude('-1000')).toBeNull();
  });

  it('returns the numeric coordinate for valid inputs', () => {
    expect(parseLongitude(180)).toBeCloseTo(180);
    expect(parseLongitude('-180')).toBeCloseTo(-180);
    expect(parseLongitude('179.999999')).toBeCloseTo(179.999_999);
    expect(parseLongitude(-179.9)).toBeCloseTo(-179.9);
    expect(parseLongitude('0')).toBeCloseTo(0);
    expect(parseLongitude('-0.0')).toBeCloseTo(-0);
  });
});

describe('parsing longitude from null input', () => {
  it('returns null for null input', () => {
    expect(parseLongitude(null)).toBeNull();
  });
});
