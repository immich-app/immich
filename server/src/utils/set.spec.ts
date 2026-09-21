import { describe, it } from 'vitest';
import { areSetsEqual } from 'src/utils/set.js';

describe(areSetsEqual.name, () => {
  it('should return true for two identical string sets', () => {
    const setA = new Set(['a', 'b', 'c']);
    const setB = new Set(['a', 'b', 'c']);

    expect(areSetsEqual(setA, setB)).toBe(true);
  });

  it('should return true for two sets with value-identical objects', () => {
    const setA = new Set([{ a: 1 }, { b: 2 }]);
    const setB = new Set([{ a: 1 }, { b: 2 }]);

    expect(areSetsEqual(setA, setB)).toBe(true);
  });

  it('should return true for two sets with value-identical objects with swapped keys', () => {
    const setA = new Set([{ a: 1, b: 2 }]);
    const setB = new Set([{ b: 2, a: 1 }]);

    expect(areSetsEqual(setA, setB)).toBe(true);
  });

  it('should return false for deeply nested differences in objects in set', () => {
    const setA = new Set([{ a: 1 }, { b: { foo: true } }]);
    const setB = new Set([{ a: 1 }, { b: { foo: false } }]);

    expect(areSetsEqual(setA, setB)).toBe(false);
  });
});
