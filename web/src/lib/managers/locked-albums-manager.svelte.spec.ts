import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { LockedAlbumsManager } from '$lib/managers/locked-albums-manager.svelte';
import { isRelockRequired, unlockLockedAccess } from '$lib/services/locked-access';
import { lockedAlbums, LockedAlbumsError, type LockedAlbum } from '$lib/services/locked-albums';

const album: LockedAlbum = { id: 'group', albumName: 'Synthetic group', createdAt: '', updatedAt: '', assetCount: 1 };

describe('experimental locked album lifecycle', () => {
  let manager: LockedAlbumsManager;
  const onError = vi.fn();
  const onLock = vi.fn();

  beforeEach(async () => {
    vi.useFakeTimers();
    onError.mockReset();
    onLock.mockReset();
    sdkMock.lockAuthSession.mockReset().mockResolvedValue(undefined as never);
    sdkMock.unlockAuthSession.mockResolvedValue(undefined as never);
    await unlockLockedAccess('123456');
    vi.spyOn(lockedAlbums, 'list').mockResolvedValue([album]);
    vi.spyOn(lockedAlbums, 'assets').mockResolvedValue({ assetIds: ['asset'], hasNextPage: false });
    manager = new LockedAlbumsManager(onError);
  });

  afterEach(() => {
    manager.destroy();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const mount = async () => {
    manager.mount(onLock, Date.now() + 60_000);
    await vi.waitFor(() => expect(manager.busy).toBe(false));
  };

  it.each(['SessionLocked', 'AuthLogout', 'SessionDelete'] as const)('clears private state on %s', async (event) => {
    await mount();
    await manager.select('group');
    expect(manager.assetIds).toEqual(['asset']);
    eventManager.emit(event);
    expect(manager.albums).toEqual([]);
    expect(manager.assetIds).toEqual([]);
    expect(manager.selectedId).toBe('');
    expect(manager.locked).toBe(true);
    expect(onLock).toHaveBeenCalled();
  });

  it('discards a pending list result after destruction', async () => {
    let resolve!: (albums: LockedAlbum[]) => void;
    vi.mocked(lockedAlbums.list).mockImplementation(() => new Promise((done) => (resolve = done)));
    manager.mount(onLock, Date.now() + 60_000);
    await vi.waitFor(() => expect(lockedAlbums.list).toHaveBeenCalled());
    const signal = vi.mocked(lockedAlbums.list).mock.calls[0][0];
    manager.destroy();
    resolve([album]);
    await Promise.resolve();
    expect(signal.aborted).toBe(true);
    expect(manager.albums).toEqual([]);
  });

  it('discards pending member results after locking', async () => {
    await mount();
    let resolve!: (page: { assetIds: string[]; hasNextPage: boolean }) => void;
    vi.mocked(lockedAlbums.assets).mockImplementation(() => new Promise((done) => (resolve = done)));
    const pending = manager.select('group');
    eventManager.emit('SessionLocked');
    resolve({ assetIds: ['late-private-id'], hasNextPage: true });
    await pending;
    expect(manager.assetIds).toEqual([]);
    expect(manager.hasNextPage).toBe(false);
  });

  it('clears state when elevation expires without another request', async () => {
    await mount();
    await manager.select('group');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(manager.locked).toBe(true);
    expect(manager.albums).toEqual([]);
    expect(manager.assetIds).toEqual([]);
    expect(sdkMock.lockAuthSession).toHaveBeenCalledOnce();
  });

  it.each([401, 403])('fails closed on HTTP %s and cannot load again', async (status) => {
    await mount();
    vi.mocked(lockedAlbums.assets).mockRejectedValue(new LockedAlbumsError(status));
    await manager.select('group');
    expect(manager.locked).toBe(true);
    expect(manager.albums).toEqual([]);
    await manager.refresh();
    expect(lockedAlbums.list).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it.each([NaN, Infinity, 0])('fails closed without a valid confirmed expiration deadline (%s)', (deadline) => {
    manager.mount(onLock, deadline);
    expect(manager.locked).toBe(true);
    expect(lockedAlbums.list).not.toHaveBeenCalled();
  });

  it('clears immediately and latches PIN reentry even if server revocation fails', async () => {
    sdkMock.lockAuthSession.mockRejectedValue(new Error('offline'));
    await mount();
    await manager.select('group');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(manager.locked).toBe(true);
    expect(manager.assetIds).toEqual([]);
    expect(isRelockRequired()).toBe(true);
    expect(sdkMock.lockAuthSession).toHaveBeenCalledOnce();
    const nextManager = new LockedAlbumsManager(onError);
    nextManager.mount(onLock, Date.now() + 60_000);
    expect(nextManager.locked).toBe(true);
    expect(lockedAlbums.list).toHaveBeenCalledTimes(1);
    nextManager.destroy();
  });

  it('does not deny confirmed timeline access when only the grouping endpoint fails', async () => {
    vi.mocked(lockedAlbums.list).mockRejectedValue(new LockedAlbumsError(404));
    await mount();
    expect(manager.locked).toBe(false);
    expect(onLock).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(manager.locked).toBe(true);
    expect(sdkMock.lockAuthSession).toHaveBeenCalledOnce();
  });

  it('enforces the captured deadline even while group-list loading hangs', async () => {
    vi.mocked(lockedAlbums.list).mockImplementation(() => new Promise(() => {}));
    manager.mount(onLock, Date.now() + 60_000);
    expect(manager.busy).toBe(true);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(manager.locked).toBe(true);
    expect(manager.busy).toBe(false);
    expect(onLock).toHaveBeenCalledOnce();
    expect(sdkMock.lockAuthSession).toHaveBeenCalledOnce();
  });
});
