import { defaults } from '@immich/sdk';
import { lockedAlbums, LockedAlbumsError } from '$lib/services/locked-albums';

describe('experimental locked album adapter', () => {
  const originalFetch = defaults.fetch;
  const originalBaseUrl = defaults.baseUrl;
  const fetchMock = vi.fn<typeof fetch>();
  let controller: AbortController;

  beforeEach(() => {
    controller = new AbortController();
    fetchMock.mockReset();
    defaults.fetch = fetchMock;
    defaults.baseUrl = '/api';
  });

  afterEach(() => {
    defaults.fetch = originalFetch;
    defaults.baseUrl = originalBaseUrl;
  });

  it('uses the configured SDK fetch with session cookies, no store and an abort signal', async () => {
    fetchMock.mockResolvedValue(Response.json([]));
    await expect(lockedAlbums.list(controller.signal)).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith('/api/locked-albums', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      body: undefined,
    });
  });

  it('sends membership changes as bounded JSON requests and accepts 204', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await lockedAlbums.updateAssets('group', ['asset'], false, controller.signal);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/locked-albums/group/assets',
      expect.objectContaining({ method: 'DELETE', body: JSON.stringify({ ids: ['asset'] }) }),
    );
    expect(() => lockedAlbums.updateAssets('group', [], true, controller.signal)).toThrow();
    expect(() =>
      lockedAlbums.updateAssets(
        'group',
        Array.from({ length: 101 }, () => 'asset'),
        true,
        controller.signal,
      ),
    ).toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('encodes IDs and paginates members', async () => {
    fetchMock.mockResolvedValue(Response.json({ assetIds: [], hasNextPage: false }));
    await lockedAlbums.assets('a/b', 50, controller.signal);
    expect(fetchMock).toHaveBeenCalledWith('/api/locked-albums/a%2Fb/assets?skip=50&take=50', expect.anything());
  });

  it('does not retain server error details', async () => {
    fetchMock.mockResolvedValue(Response.json({ message: 'private name' }, { status: 403 }));
    await expect(lockedAlbums.list(controller.signal)).rejects.toEqual(new LockedAlbumsError(403));
  });

  it('rejects late responses even if the fetch implementation ignores cancellation', async () => {
    fetchMock.mockImplementation(() => {
      controller.abort();
      return Promise.resolve(Response.json([{ albumName: 'private name' }]));
    });
    await expect(lockedAlbums.list(controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('does not issue already-aborted requests', async () => {
    controller.abort();
    await expect(lockedAlbums.list(controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
