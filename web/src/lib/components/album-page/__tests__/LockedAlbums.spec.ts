import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import LockedAlbums from '$lib/components/album-page/LockedAlbums.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { unlockLockedAccess } from '$lib/services/locked-access';
import { lockedAlbums } from '$lib/services/locked-albums';

vi.mock('$lib/managers/asset-multi-select-manager.svelte', () => ({ assetMultiSelectManager: { assets: [] } }));

describe('experimental private groups panel', () => {
  beforeEach(async () => {
    sdkMock.unlockAuthSession.mockResolvedValue(undefined as never);
    await unlockLockedAccess('123456');
    vi.spyOn(lockedAlbums, 'list').mockResolvedValue([]);
    vi.spyOn(lockedAlbums, 'create').mockResolvedValue({
      id: 'group',
      albumName: 'Synthetic group',
      createdAt: '',
      updatedAt: '',
      assetCount: 0,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('creates a named grouping through the management UI', async () => {
    render(LockedAlbums, { deadline: Date.now() + 60_000 });
    const create = screen.getByRole('button', { name: 'Create group' });
    await waitFor(() => expect(lockedAlbums.list).toHaveBeenCalled());
    await fireEvent.input(screen.getByLabelText('Group name'), { target: { value: ' Synthetic group ' } });
    await waitFor(() => expect(create.hasAttribute('disabled')).toBe(false));
    await fireEvent.click(create);
    await waitFor(() => expect(lockedAlbums.create).toHaveBeenCalledWith('Synthetic group', expect.any(AbortSignal)));
  });

  it.each(['SessionLocked', 'AuthLogout', 'SessionDelete'] as const)(
    'removes private form data on %s',
    async (event) => {
      render(LockedAlbums, { deadline: Date.now() + 60_000 });
      await waitFor(() => expect(lockedAlbums.list).toHaveBeenCalled());
      const input = screen.getByLabelText('Group name');
      await fireEvent.input(input, { target: { value: 'Private draft' } });
      eventManager.emit(event);
      await waitFor(() => expect(screen.queryByLabelText('Group name')).toBeNull());
      expect(screen.queryByRole('region', { name: 'Private groups (experimental)' })).toBeNull();
    },
  );

  it('aborts in-flight loading on unmount', async () => {
    vi.mocked(lockedAlbums.list).mockImplementation(() => new Promise(() => {}));
    const { unmount } = render(LockedAlbums, { deadline: Date.now() + 60_000 });
    await waitFor(() => expect(lockedAlbums.list).toHaveBeenCalled());
    const signal = vi.mocked(lockedAlbums.list).mock.calls[0][0];
    unmount();
    expect(signal.aborted).toBe(true);
  });
});
