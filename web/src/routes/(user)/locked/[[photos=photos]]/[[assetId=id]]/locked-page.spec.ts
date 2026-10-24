import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { revokeLockedAccess, unlockLockedAccess } from '$lib/services/locked-access';
import { lockedAlbums } from '$lib/services/locked-albums';
import { load } from './+page';

vi.mock('$lib/utils/auth', () => ({ authenticate: vi.fn() }));
vi.mock('$lib/utils/i18n', () => ({ getFormatter: () => Promise.resolve((key: string) => key) }));

describe('locked route access gate', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    sdkMock.unlockAuthSession.mockReset().mockResolvedValue(undefined as never);
    sdkMock.lockAuthSession.mockReset().mockResolvedValue(undefined as never);
    sdkMock.getAuthStatus.mockReset();
    await unlockLockedAccess('123456');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const loadPage = () => load({ url: new URL('http://localhost/locked') } as Parameters<typeof load>[0]);

  it('returns the confirmed deadline without querying the grouping endpoint', async () => {
    const deadline = Date.now() + 60_000;
    sdkMock.getAuthStatus.mockResolvedValue({
      isElevated: true,
      pinCode: true,
      password: true,
      pinExpiresAt: new Date(deadline).toISOString(),
    });
    const list = vi.spyOn(lockedAlbums, 'list').mockRejectedValue(new Error('group API unavailable'));
    await expect(loadPage()).resolves.toMatchObject({ lockedUntil: deadline });
    expect(list).not.toHaveBeenCalled();
  });

  it('does not return renderable page data while confirmation stalls, and redirects after four seconds', async () => {
    sdkMock.getAuthStatus.mockImplementation(() => new Promise(() => {}));
    const pending = loadPage();
    const settled = vi.fn();
    void pending.then(settled).catch(settled);
    await vi.advanceTimersByTimeAsync(3999);
    expect(settled).not.toHaveBeenCalled();
    const rejected = expect(pending).rejects.toMatchObject({
      status: 307,
      location: expect.stringContaining('pin-prompt'),
    });
    await vi.advanceTimersByTimeAsync(1);
    await rejected;
  });

  it('requires PIN reentry after failed revocation even if the server would still report elevation', async () => {
    sdkMock.lockAuthSession.mockRejectedValue(new Error('offline'));
    await expect(revokeLockedAccess()).resolves.toBe(false);
    sdkMock.getAuthStatus.mockResolvedValue({
      isElevated: true,
      pinCode: true,
      password: true,
      pinExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    await expect(loadPage()).rejects.toMatchObject({ status: 307, location: expect.stringContaining('pin-prompt') });
    expect(sdkMock.getAuthStatus).not.toHaveBeenCalled();
  });
});
