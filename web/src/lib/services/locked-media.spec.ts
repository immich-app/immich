import { defaults } from '@immich/sdk';
import { lockedMedia } from '$lib/services/locked-media';

describe('private media transport', () => {
  const originalFetch = defaults.fetch;
  const originalBaseUrl = defaults.baseUrl;
  const fetchMock = vi.fn<typeof fetch>();
  let controller: AbortController;

  beforeEach(() => {
    controller = new AbortController();
    defaults.baseUrl = '/api';
    defaults.fetch = fetchMock;
    fetchMock.mockReset();
  });

  afterEach(() => {
    defaults.fetch = originalFetch;
    defaults.baseUrl = originalBaseUrl;
  });

  const info = () => Response.json({ id: 'a/b', visibility: 'locked', type: 'IMAGE' });
  const image = () => new Response(new Blob(['synthetic'], { type: 'image/jpeg' }));

  it('authenticates asset info and thumbnails with cookies only and no-store', async () => {
    const originalHeaders = defaults.headers;
    defaults.headers = { 'x-api-key': 'must-not-inherit' };
    try {
      fetchMock.mockResolvedValueOnce(info()).mockResolvedValueOnce(image());
      const result = await lockedMedia.load('a/b', 'thumbnail', controller.signal);
      expect(result.blob.type).toBe('image/jpeg');
      expect(result.video).toBe(false);
      expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
        '/api/assets/a%2Fb',
        '/api/assets/a%2Fb/thumbnail?size=thumbnail',
      ]);
      for (const [, options] of fetchMock.mock.calls) {
        expect(options).toEqual({
          credentials: 'same-origin',
          cache: 'no-store',
          signal: controller.signal,
          headers: { Accept: '*/*' },
        });
      }
    } finally {
      defaults.headers = originalHeaders;
    }
  });

  it.each(['timeline', 'archive', undefined])('never fetches media for visibility %s', async (visibility) => {
    fetchMock.mockResolvedValueOnce(Response.json({ id: 'a/b', visibility }));
    await expect(lockedMedia.load('a/b', 'preview', controller.signal)).rejects.toThrow('Private photo unavailable');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects a mismatched asset and untrusted image content', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ id: 'other', visibility: 'locked' }));
    await expect(lockedMedia.load('a/b', 'preview', controller.signal)).rejects.toThrow();
    fetchMock.mockResolvedValueOnce(info()).mockResolvedValueOnce(
      new Response('<svg/>', {
        headers: { 'Content-Type': 'image/svg+xml' },
      }),
    );
    await expect(lockedMedia.load('a/b', 'preview', controller.signal)).rejects.toThrow('Private preview unavailable');
  });

  it('discards late media even when fetch ignores cancellation', async () => {
    fetchMock.mockResolvedValueOnce(info()).mockImplementationOnce(() => {
      controller.abort();
      return Promise.resolve(image());
    });
    await expect(lockedMedia.load('a/b', 'preview', controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('does not retain authorization failure bodies or issue aborted requests', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ message: 'private metadata' }, { status: 403 }));
    await expect(lockedMedia.load('a/b', 'preview', controller.signal)).rejects.toMatchObject({ status: 403 });
    controller.abort();
    await expect(lockedMedia.load('a/b', 'preview', controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
