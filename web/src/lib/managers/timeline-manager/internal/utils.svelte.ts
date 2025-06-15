import type { TagResponseDto } from '@immich/sdk';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function updateObject(target: any, source: any): boolean {
  if (!target) {
    return false;
  }
  let updated = false;
  for (const key in source) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) {
      continue;
    }
    if (key === '__proto__' || key === 'constructor') {
      continue;
    }
    const isDate = target[key] instanceof Date;
    if (typeof target[key] === 'object' && !isDate) {
      updated = updated || updateObject(target[key], source[key]);
    } else {
      if (target[key] !== source[key]) {
        target[key] = source[key];
        updated = true;
      }
    }
  }
  return updated;
}
export function isMismatched<T>(option: T | undefined, value: T): boolean {
  return option === undefined ? false : option !== value;
}

export function isMismatchedTag(target: string | undefined, tags: TagResponseDto[] | null): boolean {
  if (target === undefined) {
    return false;
  }
  if (tags === null) {
    return true;
  }
  return !tags.some((candidate) => candidate.value === target);
}
