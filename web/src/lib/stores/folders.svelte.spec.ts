import { foldersStore } from '$lib/stores/folders.svelte';
import { getUniqueOriginalPaths } from '@immich/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
});
