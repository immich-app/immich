import { isDecimalNumber, isNumberInRange, parseLatitude, parseLongitude, toNumberOrNull } from 'src/utils';

describe('checks if a number is a decimal number', () => {
  it('returns false for non-decimal numbers', () => {
    expect(isDecimalNumber(Number.NaN)).toBe(false);
    expect(isDecimalNumber(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isDecimalNumber(Number.NEGATIVE_INFINITY)).toBe(false);
  });

  it('returns true for decimal numbers', () => {
    expect(isDecimalNumber(0)).toBe(true);
    expect(isDecimalNumber(-0)).toBe(true);
    expect(isDecimalNumber(10.123_45)).toBe(true);
    expect(isDecimalNumber(Number.MAX_VALUE)).toBe(true);
    expect(isDecimalNumber(Number.MIN_VALUE)).toBe(true);
  });
});

describe('checks if a number is within a range', () => {
  it('returns false for numbers outside the range', () => {
    expect(isNumberInRange(0, 10, 10)).toBe(false);
    expect(isNumberInRange(0.01, 10, 10)).toBe(false);
    expect(isNumberInRange(50.1, 0, 50)).toBe(false);
  });

  it('returns true for numbers inside the range', () => {
    expect(isNumberInRange(0, 0, 50)).toBe(true);
    expect(isNumberInRange(50, 0, 50)).toBe(true);
    expect(isNumberInRange(-50.123_45, -50.123_45, 0)).toBe(true);
  });
});

describe('converts input to a number or null', () => {
  it('returns null for invalid inputs', () => {
    expect(toNumberOrNull(null)).toBeNull();
    // eslint-disable-next-line unicorn/no-useless-undefined
    expect(toNumberOrNull(undefined)).toBeNull();
    expect(toNumberOrNull('')).toBeNull();
    expect(toNumberOrNull(Number.NaN)).toBeNull();
  });

  it('returns a number for valid inputs', () => {
    expect(toNumberOrNull(0)).toBeCloseTo(0);
    expect(toNumberOrNull('0')).toBeCloseTo(0);
    expect(toNumberOrNull('-123.45')).toBeCloseTo(-123.45);
  });
});

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
