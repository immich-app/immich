import { compareUtf8 } from 'src/utils/ordered.js';

const characters = ['a', '/', '.', 'é', '퟿', '', '�', '￿', '\u{10000}', '\u{1F4F7}'];

const allStrings = (maxLength: number) => {
  const strings = [''];
  let previous = [''];
  for (let length = 1; length <= maxLength; length++) {
    previous = previous.flatMap((prefix) => characters.map((character) => prefix + character));
    strings.push(...previous);
  }
  return strings;
};

describe('compareUtf8', () => {
  it('should order strings like Buffer.compare', () => {
    const strings = allStrings(3);
    const mismatches: string[][] = [];

    for (const a of strings) {
      for (const b of strings) {
        if (Math.sign(compareUtf8(a, b)) !== Buffer.compare(Buffer.from(a), Buffer.from(b))) {
          mismatches.push([a, b]);
        }
      }
    }

    expect(mismatches).toEqual([]);
  });

  it.each([
    { a: '�', b: '\u{1F4F7}' },
    { a: '', b: '\u{10000}' },
    { a: '/photos/￿.jpg', b: '/photos/\u{1F4F7}.jpg' },
  ])('should sort $a before the astral $b', ({ a, b }) => {
    expect(compareUtf8(a, b)).toBeLessThan(0);
    expect(compareUtf8(b, a)).toBeGreaterThan(0);
  });

  it('should return zero for equal strings', () => {
    expect(compareUtf8('/photos/a.jpg', '/photos/a.jpg')).toBe(0);
  });

  it('should sort a prefix first', () => {
    expect(compareUtf8('/photos/a', '/photos/a.jpg')).toBeLessThan(0);
  });
});
