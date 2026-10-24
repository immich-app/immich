import { describe, expect, it } from 'vitest';
import { updateObject } from './utils.svelte';

describe('updateObject', () => {
  it('updates primitive fields', () => {
    const target = { a: 1, b: 'old' };
    updateObject(target, { a: 2, b: 'new' });
    expect(target).toEqual({ a: 2, b: 'new' });
  });

  it('sets object field to null', () => {
    const target = { stack: { id: 'abc', primaryAssetId: 'xyz', assetCount: 3 } };
    updateObject(target, { stack: null });
    expect(target.stack).toBeNull();
  });

  it('sets object field to undefined', () => {
    const target = { stack: { id: 'abc', primaryAssetId: 'xyz', assetCount: 3 } };
    updateObject(target, { stack: undefined });
    expect(target.stack).toBeUndefined();
  });

  it('does not overwrite existing value with null if already null', () => {
    const target = { stack: null };
    const updated = updateObject(target, { stack: null });
    expect(updated).toBe(false);
    expect(target.stack).toBeNull();
  });

  it('recursively updates nested objects', () => {
    const target = { exif: { city: 'Berlin', country: 'Germany' } };
    updateObject(target, { exif: { city: 'Munich' } });
    expect(target.exif.city).toBe('Munich');
    expect(target.exif.country).toBe('Germany');
  });

  it('returns true when a change was made', () => {
    const target = { stack: { id: 'abc', primaryAssetId: 'xyz', assetCount: 3 } };
    const updated = updateObject(target, { stack: null });
    expect(updated).toBe(true);
  });

  it('returns false when nothing changed', () => {
    const target = { a: 1 };
    const updated = updateObject(target, { a: 1 });
    expect(updated).toBe(false);
  });
});
