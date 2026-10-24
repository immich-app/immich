import { AssetVisibility, defaults } from '@immich/sdk';
import { LockedAlbumsError } from '$lib/services/locked-albums';

/** Session-only requests: no SDK auth defaults, shared-link parameters or caches. */
async function request(path: string, signal: AbortSignal) {
  signal.throwIfAborted();
  const response = await (defaults.fetch ?? fetch)(`${defaults.baseUrl}/assets/${path}`, {
    signal,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: '*/*' },
  });
  signal.throwIfAborted();
  if (!response.ok) {
    throw new LockedAlbumsError(response.status);
  }
  return response;
}

export const lockedMedia = {
  async load(id: string, size: 'thumbnail' | 'preview', signal: AbortSignal) {
    const path = encodeURIComponent(id);
    const response = await request(path, signal);
    // Retain neither EXIF nor filenames. Recheck membership's asset against the
    // existing elevated asset-info API before fetching any image bytes.
    const info = await response.json();
    signal.throwIfAborted();
    if (info.id !== id || info.visibility !== AssetVisibility.Locked) {
      throw new Error('Private photo unavailable');
    }
    const media = await request(`${path}/thumbnail?size=${size}`, signal);
    const blob = await media.blob();
    signal.throwIfAborted();
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'].includes(blob.type)) {
      throw new Error('Private preview unavailable');
    }
    return { blob, video: info.type === 'VIDEO' };
  },
};
