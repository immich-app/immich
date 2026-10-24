import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { eventManager } from '$lib/managers/event-manager.svelte';
import {
  confirmLockedAccess,
  isLockedAccessAllowed,
  isRelockRequired,
  revokeLockedAccess,
  subscribeToSharedLocks,
  unlockLockedAccess,
} from '$lib/services/locked-access';

describe('experimental locked access gate', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    // The generated SDK types these no-content success responses as never.
    sdkMock.unlockAuthSession.mockReset().mockResolvedValue(undefined as never);
    sdkMock.lockAuthSession.mockReset().mockResolvedValue(undefined as never);
    sdkMock.getAuthStatus.mockReset().mockResolvedValue({
      isElevated: true,
      pinCode: true,
      password: true,
      pinExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    await unlockLockedAccess('123456');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('confirms the earliest valid PIN/session deadline with a noncached abortable request', async () => {
    const deadline = Date.now() + 30_000;
    sdkMock.getAuthStatus.mockResolvedValue({
      isElevated: true,
      pinCode: true,
      password: true,
      pinExpiresAt: new Date(deadline + 30_000).toISOString(),
      expiresAt: new Date(deadline).toISOString(),
    });
    await expect(confirmLockedAccess()).resolves.toBe(deadline);
    expect(sdkMock.getAuthStatus).toHaveBeenCalledWith({ signal: expect.any(AbortSignal), cache: 'no-store' });
    expect(isLockedAccessAllowed(deadline)).toBe(true);
  });

  it.each([undefined, 'not-a-date', new Date(0).toISOString()])(
    'requires a valid future PIN deadline (%s)',
    async (pinExpiresAt) => {
      sdkMock.getAuthStatus.mockResolvedValue({ isElevated: true, pinCode: true, password: true, pinExpiresAt });
      await expect(confirmLockedAccess()).rejects.toThrow('PIN unlock required');
      expect(isRelockRequired()).toBe(true);
    },
  );

  it('rejects sessions without PIN elevation', async () => {
    sdkMock.getAuthStatus.mockResolvedValue({
      isElevated: false,
      pinCode: true,
      password: true,
      pinExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    await expect(confirmLockedAccess()).rejects.toThrow('PIN unlock required');
    expect(isRelockRequired()).toBe(true);
  });

  it('denies access when the tab cannot read the persisted relock guard', async () => {
    vi.spyOn(globalThis, 'sessionStorage', 'get').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    expect(isLockedAccessAllowed(Date.now() + 60_000)).toBe(false);
    await expect(confirmLockedAccess()).rejects.toThrow('PIN unlock required');
    expect(sdkMock.getAuthStatus).not.toHaveBeenCalled();
  });

  it('fails closed after four seconds even when the status request ignores abort', async () => {
    let resolve!: (status: Awaited<ReturnType<typeof sdkMock.getAuthStatus>>) => void;
    sdkMock.getAuthStatus.mockImplementation(() => new Promise((done) => (resolve = done)));
    const pending = confirmLockedAccess();
    const rejected = expect(pending).rejects.toThrow('PIN unlock required');
    await vi.advanceTimersByTimeAsync(4000);
    await rejected;
    expect(sdkMock.getAuthStatus.mock.calls[0][0]?.signal?.aborted).toBe(true);
    expect(isRelockRequired()).toBe(true);
    resolve({
      isElevated: true,
      pinCode: true,
      password: true,
      pinExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    await Promise.resolve();
    expect(isLockedAccessAllowed(Date.now() + 60_000)).toBe(false);
    expect(sdkMock.lockAuthSession).toHaveBeenCalledOnce();
  });

  it('clears the view before server revocation settles and bounds a hung revocation', async () => {
    sdkMock.lockAuthSession.mockImplementation(() => new Promise(() => {}));
    const onLock = vi.fn();
    const unsubscribe = eventManager.on({ SessionLocked: onLock });
    try {
      const pending = revokeLockedAccess();
      expect(onLock).toHaveBeenCalledOnce();
      expect(isRelockRequired()).toBe(true);
      await vi.advanceTimersByTimeAsync(4000);
      await expect(pending).resolves.toBe(false);
    } finally {
      unsubscribe();
    }
  });

  it('does not reset the latch after revocation succeeds, status checks, logout, or wrong PIN', async () => {
    await expect(revokeLockedAccess()).resolves.toBe(true);
    eventManager.emit('AuthLogout');
    await expect(confirmLockedAccess()).rejects.toThrow('PIN unlock required');
    expect(sdkMock.getAuthStatus).not.toHaveBeenCalled();
    sdkMock.unlockAuthSession.mockRejectedValueOnce(new Error('wrong PIN'));
    await expect(unlockLockedAccess('000000')).rejects.toThrow();
    expect(isRelockRequired()).toBe(true);
    await unlockLockedAccess('123456');
    expect(isRelockRequired()).toBe(false);
    await expect(confirmLockedAccess()).resolves.toBeGreaterThan(Date.now());
  });

  it('persists only a boolean marker and denies access in a fresh module after failed revocation', async () => {
    sdkMock.lockAuthSession.mockRejectedValue(new Error('offline'));
    await expect(revokeLockedAccess()).resolves.toBe(false);
    expect(sessionStorage.getItem('immich-experimental-locked-requires-pin')).toBe('true');
    expect(localStorage.getItem('immich-experimental-locked-requires-pin-shared')).toBe('true');
    vi.resetModules();
    const fresh = await import('$lib/services/locked-access');
    expect(fresh.isRelockRequired()).toBe(true);
    await expect(fresh.confirmLockedAccess()).rejects.toThrow('PIN unlock required');
  });

  it('requires PIN entry when a same-origin tab leaves a shared lock marker', () => {
    localStorage.setItem('immich-experimental-locked-requires-pin-shared', 'true');
    expect(isLockedAccessAllowed(Date.now() + 60_000)).toBe(false);
  });

  it('clears open private views on a shared lock event and unsubscribes on teardown', () => {
    const onLock = vi.fn();
    const unsubscribe = eventManager.on({ SessionLocked: onLock });
    const unsubscribeShared = subscribeToSharedLocks();
    try {
      dispatchEvent(
        new StorageEvent('storage', {
          key: 'immich-experimental-locked-requires-pin-shared',
          newValue: 'true',
        }),
      );
      expect(onLock).toHaveBeenCalledOnce();
      expect(isRelockRequired()).toBe(true);
      unsubscribeShared();
      dispatchEvent(
        new StorageEvent('storage', {
          key: 'immich-experimental-locked-requires-pin-shared',
          newValue: 'true',
        }),
      );
      expect(onLock).toHaveBeenCalledOnce();
    } finally {
      unsubscribeShared();
      unsubscribe();
    }
  });
});
