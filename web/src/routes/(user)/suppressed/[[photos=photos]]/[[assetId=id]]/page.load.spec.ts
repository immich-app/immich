import { getAllAlbums, getAuthStatus, type AuthStatusResponseDto } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import type { MessageFormatter } from 'svelte-i18n';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { albumFactory } from '@test-data/factories/album-factory';
import { load } from './+page';

vi.mock('@immich/sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@immich/sdk')>();

  return {
    ...actual,
    getAllAlbums: vi.fn(),
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

vi.mock('$lib/utils/i18n', () => ({
  getFormatter: vi.fn(),
}));

describe('suppressed content page load', () => {
  const authStatus = (overrides: Partial<AuthStatusResponseDto> = {}): AuthStatusResponseDto => ({
    isElevated: true,
    password: false,
    pinCode: true,
    ...overrides,
  });

  const formatMessage: MessageFormatter = (key) => (typeof key === 'string' ? key : key.id);

  const loadPage = (path = '/suppressed', search = '') =>
    load({ url: new URL(`http://localhost${path}${search}`) } as Parameters<typeof load>[0]);

  beforeEach(() => {
    vi.mocked(authenticate).mockResolvedValue(undefined);
    vi.mocked(getAuthStatus).mockResolvedValue(authStatus());
    vi.mocked(getFormatter).mockResolvedValue(formatMessage);
  });

  it('requires elevated PIN access before loading suppressed albums', async () => {
    vi.mocked(getAuthStatus).mockResolvedValue(authStatus({ isElevated: false }));

    await expect(loadPage('/suppressed', '?tab=albums')).rejects.toMatchObject({
      status: 307,
      location: '/auth/pin-prompt?continue=%2Fsuppressed%3Ftab%3Dalbums',
    });

    expect(redirect).toHaveBeenCalledWith(307, '/auth/pin-prompt?continue=%2Fsuppressed%3Ftab%3Dalbums');
    expect(getAllAlbums).not.toHaveBeenCalled();
  });

  it('loads only non-empty suppressed album metadata and preserves the selected tab', async () => {
    const ownedVisible = albumFactory.build({ id: 'owned-visible', assetCount: 2 });
    const ownedEmpty = albumFactory.build({ id: 'owned-empty', assetCount: 0 });
    const sharedVisible = albumFactory.build({ id: 'shared-visible', assetCount: 1 });
    const sharedEmpty = albumFactory.build({ id: 'shared-empty', assetCount: 0 });

    vi.mocked(getAllAlbums)
      .mockResolvedValueOnce([ownedVisible, ownedEmpty])
      .mockResolvedValueOnce([sharedVisible, sharedEmpty]);

    await expect(loadPage('/suppressed', '?tab=albums')).resolves.toEqual({
      ownedAlbums: [ownedVisible],
      sharedAlbums: [sharedVisible],
      tab: 'albums',
      meta: {
        title: 'suppressed_content',
      },
    });

    expect(getAllAlbums).toHaveBeenNthCalledWith(1, { suppressedOnly: true });
    expect(getAllAlbums).toHaveBeenNthCalledWith(2, { shared: true, suppressedOnly: true });
  });
});
