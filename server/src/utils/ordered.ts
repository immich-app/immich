import { UTF16_SURROGATE_OR_ABOVE } from 'src/constants.js';

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

export const requireAscending = (keys: string[], previous: string | undefined, name: string) => {
  for (const key of keys) {
    if (previous !== undefined && compareUtf8(previous, key) >= 0) {
      throw new Error(`${name} is not in ascending order: ${JSON.stringify(key)} after ${JSON.stringify(previous)}`);
    }

    previous = key;
  }

  return previous;
};
