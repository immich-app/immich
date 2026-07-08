import { getAssetsByOriginalPath, getUniqueOriginalPaths } from '@immich/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { foldersStore } from '$lib/stores/folders.svelte';

vi.mock('$lib/managers/event-manager.svelte', () => ({
  eventManager: {
    on: vi.fn(),
  },
}));

vi.mock('@immich/sdk', () => ({
  getAssetsByOriginalPath: vi.fn(),
  getUniqueOriginalPaths: vi.fn(),
}));

describe('foldersStore', () => {
  beforeEach(() => {
    foldersStore.clearCache();
    vi.clearAllMocks();
  });

  it('returns the same non-null tree for concurrent fetchTree calls', async () => {
    let resolvePaths: (value: string[]) => void;

    vi.mocked(getUniqueOriginalPaths).mockReturnValue(
      new Promise<string[]>((resolve) => {
        resolvePaths = resolve;
      }),
    );

    const first = foldersStore.fetchTree();
    const second = foldersStore.fetchTree();

    resolvePaths!(['/photos/2026']);

    const [firstTree, secondTree] = await Promise.all([first, second]);

    expect(firstTree).not.toBeNull();
    expect(secondTree).not.toBeNull();
    expect(secondTree).toEqual(firstTree);
  });

  it('refreshes the folder tree when the folder becomes empty after refresh', async () => {
    vi.mocked(getAssetsByOriginalPath).mockResolvedValue([]);
    vi.mocked(getUniqueOriginalPaths).mockResolvedValue(['/photos/2026']);

    await foldersStore.refreshFolderAssets('/photos/2026');

    expect(getAssetsByOriginalPath).toHaveBeenCalledWith({ path: '/photos/2026' });
    expect(getUniqueOriginalPaths).toHaveBeenCalledTimes(1);
  });

  it('does not refresh the tree when the folder still contains assets', async () => {
    vi.mocked(getAssetsByOriginalPath).mockResolvedValue([{ id: 'asset-id' } as never]);

    await foldersStore.refreshFolderAssets('/photos/2026');

    expect(getAssetsByOriginalPath).toHaveBeenCalledWith({ path: '/photos/2026' });
    expect(getUniqueOriginalPaths).not.toHaveBeenCalled();
  });

  it('only issues one asset refresh request for a folder update', async () => {
    vi.mocked(getAssetsByOriginalPath).mockResolvedValue([{ id: 'asset-id' } as never]);

    await foldersStore.refreshFolderAssets('/photos/2026');

    expect(getAssetsByOriginalPath).toHaveBeenCalledTimes(1);
    expect(getUniqueOriginalPaths).not.toHaveBeenCalled();
  });

  it('updates the cached assets after a refresh', async () => {
    vi.mocked(getAssetsByOriginalPath).mockResolvedValueOnce([{ id: 'asset-id' } as never]);

    await foldersStore.refreshAssetsByPath('/photos/2026');

    expect(await foldersStore.fetchAssetsByPath('/photos/2026')).toEqual([{ id: 'asset-id' }]);

    vi.mocked(getAssetsByOriginalPath).mockResolvedValueOnce([{ id: 'asset-id-2' } as never]);

    await foldersStore.refreshAssetsByPath('/photos/2026');

    await expect(foldersStore.fetchAssetsByPath('/photos/2026')).resolves.toEqual([{ id: 'asset-id-2' }]);
  });
});
