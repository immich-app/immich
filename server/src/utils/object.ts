import { isEqual, isPlainObject } from 'lodash';

/**
 * Deeply clones and converts a class instance to a plain object.
 */
export function toPlainObject<T extends object>(obj: T): T {
  return isPlainObject(obj) ? obj : structuredClone(obj);
}

/**
 * Performs a deep comparison between objects, converting them to plain objects first if needed.
 */
export function isEqualObject(value: object, other: object): boolean {
  return isEqual(toPlainObject(value), toPlainObject(other));
}
