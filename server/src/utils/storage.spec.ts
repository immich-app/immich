import { detectMediaLocation, resolveMediaLocation } from 'src/utils/storage';
import { describe, expect, it } from 'vitest';

const existing = (paths: string[]) => (path: string) => paths.includes(path);

describe('resolveMediaLocation', () => {
  it('trusts the configured media location', () => {
    expect(resolveMediaLocation('/mnt/media', existing([]))).toEqual({ path: '/mnt/media', ambiguous: false });
  });

  it('picks the only candidate that exists', () => {
    expect(resolveMediaLocation(undefined, existing(['/data']))).toEqual({ path: '/data', ambiguous: false });
    expect(resolveMediaLocation(undefined, existing(['/usr/src/app/upload']))).toEqual({
      path: '/usr/src/app/upload',
      ambiguous: false,
    });
  });

  it('reports ambiguity when both candidates exist', () => {
    const result = resolveMediaLocation(undefined, existing(['/data', '/usr/src/app/upload']));

    expect(result.ambiguous).toBe(true);
    expect(result.path).toBe('/usr/src/app/upload');
    expect(result.ambiguous && result.reason).toContain('both exist');
    expect(result.ambiguous && result.reason).toContain('IMMICH_MEDIA_LOCATION');
  });

  it('reports ambiguity when no candidate exists', () => {
    const result = resolveMediaLocation(undefined, existing([]));

    expect(result.ambiguous).toBe(true);
    expect(result.path).toBe('/usr/src/app/upload');
    expect(result.ambiguous && result.reason).toContain('none of');
    expect(result.ambiguous && result.reason).toContain('IMMICH_MEDIA_LOCATION');
  });
});

describe('detectMediaLocation', () => {
  it('keeps returning a bare path for existing callers', () => {
    expect(detectMediaLocation('/mnt/media', existing([]))).toBe('/mnt/media');
    expect(detectMediaLocation(undefined, existing(['/data']))).toBe('/data');
    expect(detectMediaLocation(undefined, existing(['/data', '/usr/src/app/upload']))).toBe('/usr/src/app/upload');
    expect(detectMediaLocation(undefined, existing([]))).toBe('/usr/src/app/upload');
  });
});
