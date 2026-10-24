import { defaults, type LockedAlbumAssetsResponseDto, type LockedAlbumResponseDto } from '@immich/sdk';

// Generated contracts, with an intentionally cookie-only/no-store transport.
// The ordinary SDK transport merges global API-key/shared-link defaults.
export type LockedAlbum = LockedAlbumResponseDto;
export type LockedAlbumAssets = LockedAlbumAssetsResponseDto;

export class LockedAlbumsError extends Error {
  constructor(readonly status: number) {
    super('Unable to update private groups');
  }
}

async function request<T>(path: string, signal: AbortSignal, method = 'GET', body?: unknown): Promise<T> {
  signal.throwIfAborted();
  const response = await (defaults.fetch ?? fetch)(`${defaults.baseUrl}/locked-albums${path}`, {
    method,
    signal,
    credentials: 'same-origin',
    cache: 'no-store',
    // Do not inherit API key/shared-link authentication from SDK defaults.
    headers: { Accept: 'application/json', ...(body !== undefined && { 'Content-Type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  signal.throwIfAborted();
  if (!response.ok) {
    // Do not retain server error bodies containing private metadata.
    throw new LockedAlbumsError(response.status);
  }
  const result = response.status === 204 ? undefined : await response.json();
  signal.throwIfAborted();
  return result as T;
}

const albumPath = (id: string) => `/${encodeURIComponent(id)}`;

export const lockedAlbums = {
  list: (signal: AbortSignal) => request<LockedAlbum[]>('', signal),
  create: (albumName: string, signal: AbortSignal) => request<LockedAlbum>('', signal, 'POST', { albumName }),
  rename: (id: string, albumName: string, signal: AbortSignal) =>
    request<LockedAlbum>(albumPath(id), signal, 'PATCH', { albumName }),
  delete: (id: string, signal: AbortSignal) => request<void>(albumPath(id), signal, 'DELETE'),
  assets: (id: string, skip: number, signal: AbortSignal) =>
    request<LockedAlbumAssets>(`${albumPath(id)}/assets?skip=${skip}&take=50`, signal),
  updateAssets: (id: string, ids: string[], add: boolean, signal: AbortSignal) => {
    if (ids.length === 0 || ids.length > 100) {
      throw new Error('Select between 1 and 100 assets');
    }
    return request<void>(`${albumPath(id)}/assets`, signal, add ? 'PUT' : 'DELETE', { ids });
  },
};
