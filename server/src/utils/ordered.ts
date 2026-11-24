import { UTF16_SURROGATE_OR_ABOVE } from 'src/constants.js';

export type OrderedFiles = { paths: string[]; modified: number[] };

export const compareUtf8 = (a: string, b: string) => {
  if (a === b) {
    return 0;
  }

  if (!UTF16_SURROGATE_OR_ABOVE.test(a) || !UTF16_SURROGATE_OR_ABOVE.test(b)) {
    return a < b ? -1 : 1;
  }

  const length = Math.min(a.length, b.length);
  let index = 0;
  while (index < length && a.codePointAt(index) === b.codePointAt(index)) {
    index++;
  }

  if (index === length) {
    return a.length - b.length;
  }

  return a.codePointAt(index)! - b.codePointAt(index)!;
};

export class OrderedCursor<T> {
  batch?: T;
  index = 0;
  count = 0;
  private keys: string[] = [];
  private previous?: string;

  private iterator: AsyncIterator<T>;

  constructor(
    source: AsyncIterable<T>,
    private getKeys: (batch: T) => string[],
    private name: string,
  ) {
    this.iterator = source[Symbol.asyncIterator]();
  }

  get key(): string | undefined {
    return this.keys[this.index];
  }

  advance() {
    this.index++;
    this.count++;
    if (this.index >= this.keys.length) {
      return false;
    }

    this.requireAscending();
    return true;
  }

  async fill() {
    while (this.index >= this.keys.length) {
      const { done, value } = await this.iterator.next();
      if (done) {
        return;
      }

      this.batch = value;
      this.keys = this.getKeys(value);
      this.index = 0;
    }

    this.requireAscending();
  }

  async close() {
    await this.iterator.return?.();
  }

  private requireAscending() {
    const key = this.keys[this.index];
    if (this.previous !== undefined && compareUtf8(this.previous, key) >= 0) {
      throw new Error(
        `${this.name} is not in ascending order: ${JSON.stringify(key)} after ${JSON.stringify(this.previous)}`,
      );
    }

    this.previous = key;
  }
}

export async function* mergeOrdered(sources: AsyncIterable<OrderedFiles>[]): AsyncGenerator<OrderedFiles> {
  const cursors = sources.map((source) => new OrderedCursor(source, ({ paths }) => paths, 'File walk'));
  try {
    await Promise.all(cursors.map((cursor) => cursor.fill()));
    yield* mergeCursors(cursors);
  } finally {
    await Promise.all(cursors.map((cursor) => cursor.close()));
  }
}

async function* mergeCursors(cursors: OrderedCursor<OrderedFiles>[]): AsyncGenerator<OrderedFiles> {
  let batch: OrderedFiles = { paths: [], modified: [] };

  for (let first = getFirst(cursors); first; first = getFirst(cursors)) {
    const path = first.key!;
    batch.paths.push(path);
    batch.modified.push(first.batch!.modified[first.index]);

    for (const cursor of cursors) {
      if (cursor.key !== path || cursor.advance()) {
        continue;
      }

      if (batch.paths.length > 0) {
        yield batch;
        batch = { paths: [], modified: [] };
      }
      await cursor.fill();
    }
  }

  if (batch.paths.length > 0) {
    yield batch;
  }
}

const getFirst = <T>(cursors: OrderedCursor<T>[]) => {
  let first: OrderedCursor<T> | undefined;
  for (const cursor of cursors) {
    if (cursor.key !== undefined && (!first || compareUtf8(cursor.key, first.key!) < 0)) {
      first = cursor;
    }
  }
  return first;
};
