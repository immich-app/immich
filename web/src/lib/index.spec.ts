import { cleanClass, isDefined } from '$lib';

describe('cleanClass', () => {
  it('should return a string of class names', () => {
    expect(cleanClass('class1', 'class2', 'class3')).toBe('class1 class2 class3');
  });

  it('should filter out undefined, null, and false values', () => {
    expect(cleanClass('class1', undefined, 'class2', null, 'class3', false)).toBe('class1 class2 class3');
  });

  it('should unnest arrays', () => {
    expect(cleanClass('class1', ['class2', 'class3'])).toBe('class1 class2 class3');
  });
});

describe('isDefined', () => {
  it('should return false for null', () => {
    expect(isDefined(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isDefined(undefined)).toBe(false);
  });

  it('should return true for everything else', () => {
    for (const value of [0, 1, 2, true, false, {}, 'foo', 'bar', []]) {
      expect(isDefined(value)).toBe(true);
    }
  });
});
