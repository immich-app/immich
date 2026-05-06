import { getAlbumInfo, getAuthStatus, type AuthStatusResponseDto } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import { authenticate } from '$lib/utils/auth';
import { albumFactory } from '@test-data/factories/album-factory';
import { load } from './+page';

vi.mock('@immich/sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@immich/sdk')>();

  return {
    ...actual,
    getAlbumInfo: vi.fn(),
    getAuthStatus: vi.fn(),
  };
});

vi.mock('@sveltejs/kit', () => ({
  redirect: vi.fn((status: number, location: string) => {
    throw { status, location };
  }),
}));

vi.mock('$lib/utils/auth', () => ({
  authenticate: vi.fn(),
}));

describe('suppressed album page load', () => {
  const authStatus = (overrides: Partial<AuthStatusResponseDto> = {}): AuthStatusResponseDto => ({
    isElevated: true,
    password: false,
    pinCode: true,
    ...overrides,
  });

  const loadPage = (path = '/suppressed/albums/album-1', search = '') => {
    const depends = vi.fn();

    return {
      depends,
      response: load({
        depends,
        params: { albumId: 'album-1' },
        url: new URL(`http://localhost${path}${search}`),
      } as unknown as Parameters<typeof load>[0]),
    };
  };

  beforeEach(() => {
    vi.mocked(authenticate).mockResolvedValue(undefined);
    vi.mocked(getAuthStatus).mockResolvedValue(authStatus());
  });

  it('requires elevated PIN access before loading the suppressed album', async () => {
    vi.mocked(getAuthStatus).mockResolvedValue(authStatus({ pinCode: false }));
    const { response } = loadPage('/suppressed/albums/album-1/photos/asset-1', '?from=albums');

    await expect(response).rejects.toMatchObject({
      status: 307,
      location: '/auth/pin-prompt?continue=%2Fsuppressed%2Falbums%2Falbum-1%2Fphotos%2Fasset-1%3Ffrom%3Dalbums',
    });

    expect(redirect).toHaveBeenCalledWith(
      307,
      '/auth/pin-prompt?continue=%2Fsuppressed%2Falbums%2Falbum-1%2Fphotos%2Fasset-1%3Ffrom%3Dalbums',
    );
    expect(getAlbumInfo).not.toHaveBeenCalled();
  });

  it('loads album metadata with suppressedOnly and registers the album data dependency', async () => {
    const album = albumFactory.build({ id: 'album-1', albumName: 'Private album', assetCount: 3 });
    vi.mocked(getAlbumInfo).mockResolvedValue(album);

    const { depends, response } = loadPage();

    await expect(response).resolves.toEqual({
      album,
      meta: {
        title: 'Private album',
      },
    });

    expect(depends).toHaveBeenCalledWith('suppressed-album:data');
    expect(getAlbumInfo).toHaveBeenCalledWith({ id: 'album-1', suppressedOnly: true });
  });
});
