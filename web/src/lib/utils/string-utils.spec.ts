import { normalizeSearchString } from '#lib/utils/string-utils.ts';

describe('normalizeSearchString', () => {
  it.each([
    { input: '  Émilie ', expected: 'emilie' },
    { input: 'José\t', expected: 'jose' },
    { input: 'plain', expected: 'plain' },
  ])('turns "$input" into "$expected"', ({ input, expected }) => {
    expect(normalizeSearchString(input)).toBe(expected);
  });
});
