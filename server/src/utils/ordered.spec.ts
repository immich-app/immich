import { compareUtf8, mergeOrdered } from 'src/utils/ordered.js';
import { makeStream } from 'test/utils.js';

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

const collect = async (source: AsyncIterable<{ paths: string[]; modified: number[] }>) => {
  const paths: string[] = [];
  const modified: number[] = [];
  for await (const batch of source) {
    paths.push(...batch.paths);
    modified.push(...batch.modified);
  }
  return { paths, modified };
};

const onDisk = (...batches: string[][]) =>
  makeStream(batches.map((paths) => ({ paths, modified: paths.map((path) => path.length) })));

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

describe('mergeOrdered', () => {
  it('should merge sources into one ordered stream', async () => {
    await expect(collect(mergeOrdered([onDisk(['/a/1', '/a/3']), onDisk(['/a/2', '/a/4'])]))).resolves.toEqual({
      paths: ['/a/1', '/a/2', '/a/3', '/a/4'],
      modified: [4, 4, 4, 4],
    });
  });

  it('should yield a path found by several sources once', async () => {
    await expect(
      collect(mergeOrdered([onDisk(['/a/1.jpg', '/a/b/2.jpg', '/a/c.jpg']), onDisk(['/a/b/2.jpg', '/a/b/3.jpg'])])),
    ).resolves.toEqual({
      paths: ['/a/1.jpg', '/a/b/2.jpg', '/a/b/3.jpg', '/a/c.jpg'],
      modified: [8, 10, 10, 8],
    });
  });

  it.each([
    { name: 'one batch each', outer: [['/a/1', '/a/b/2', '/a/c']], inner: [['/a/b/2', '/a/b/3']] },
    { name: 'single path batches', outer: [['/a/1'], ['/a/b/2'], ['/a/c']], inner: [['/a/b/2'], ['/a/b/3']] },
    { name: 'empty batches', outer: [[], ['/a/1', '/a/b/2'], [], ['/a/c']], inner: [['/a/b/2'], [], ['/a/b/3'], []] },
  ])('should merge the same paths with $name', async ({ outer, inner }) => {
    const { paths } = await collect(mergeOrdered([onDisk(...outer), onDisk(...inner)]));

    expect(paths).toEqual(['/a/1', '/a/b/2', '/a/b/3', '/a/c']);
  });

  it('should yield nothing for empty sources', async () => {
    await expect(collect(mergeOrdered([onDisk(), onDisk([])]))).resolves.toEqual({ paths: [], modified: [] });
  });

  it('should close every source when one fails', async () => {
    const closed = vitest.fn();
    const healthy = (async function* () {
      try {
        yield* onDisk(['/a/0'], ['/a/9']);
      } finally {
        closed();
      }
    })();

    await expect(collect(mergeOrdered([onDisk(['/a/2', '/a/1']), healthy]))).rejects.toThrow(
      'File walk is not in ascending order',
    );
    expect(closed).toHaveBeenCalled();
  });

  it.each([
    { name: 'descending', batches: [['/a/2', '/a/1']] },
    { name: 'descending across batches', batches: [['/a/2'], ['/a/1']] },
    { name: 'repeated', batches: [['/a/1', '/a/1']] },
  ])('should throw when a source is $name', async ({ batches }) => {
    await expect(collect(mergeOrdered([onDisk(...batches), onDisk(['/a/0'])]))).rejects.toThrow(
      'File walk is not in ascending order',
    );
  });
});
