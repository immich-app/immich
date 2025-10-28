import type { TimelineAsset } from './types';

export const assetSnapshot = (asset: TimelineAsset): TimelineAsset => $state.snapshot(asset);
export const assetsSnapshot = (assets: TimelineAsset[]) => assets.map((asset) => $state.snapshot(asset));

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

export function setDifference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  // Check if native Set.prototype.difference is available (ES2025)
  const setWithDifference = setA as unknown as Set<T> & { difference?: (other: Set<T>) => Set<T> };
  if (setWithDifference.difference && typeof setWithDifference.difference === 'function') {
    return setWithDifference.difference(setB);
  }
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const result = new Set<T>();
  for (const value of setA) {
    if (!setB.has(value)) {
      result.add(value);
    }
  }
  return result;
}

/**
 * Removes all elements of setB from setA in-place (mutates setA).
 */
export function setDifferenceInPlace<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  for (const value of setB) {
    setA.delete(value);
  }
  return setA;
}
