import { cleanClass } from '$lib';

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
