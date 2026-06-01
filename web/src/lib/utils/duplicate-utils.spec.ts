import { getStackableDuplicateGroups, stackDuplicateGroups } from '$lib/utils/duplicate-utils';

describe('duplicate utils', () => {
  describe('getStackableDuplicateGroups', () => {
    it('orders suggested keep assets first and skips groups with fewer than two assets', () => {
      expect(
        getStackableDuplicateGroups([
          {
            duplicateId: 'duplicate-1',
            suggestedKeepAssetIds: ['asset-2'],
            assets: [{ id: 'asset-1' }, { id: 'asset-2' }, { id: 'asset-3' }],
          },
          {
            duplicateId: 'duplicate-2',
            suggestedKeepAssetIds: ['asset-4'],
            assets: [{ id: 'asset-4' }],
          },
        ]),
      ).toEqual([
        {
          duplicateId: 'duplicate-1',
          assetIds: ['asset-2', 'asset-1', 'asset-3'],
        },
      ]);
    });
  });

  describe('stackDuplicateGroups', () => {
    it('continues after a group fails and only reports groups whose duplicate IDs were cleared as successes', async () => {
      const error = new Error('failed to clear duplicateId');
      const createStack = vi.fn().mockResolvedValue(undefined);
      const updateAssets = vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined);
      const onError = vi.fn();

      await expect(
        stackDuplicateGroups(
          [
            { duplicateId: 'duplicate-1', assetIds: ['asset-1', 'asset-2'] },
            { duplicateId: 'duplicate-2', assetIds: ['asset-3', 'asset-4'] },
            { duplicateId: 'duplicate-3', assetIds: ['asset-5', 'asset-6'] },
          ],
          { createStack, updateAssets, onError },
        ),
      ).resolves.toEqual({
        succeededDuplicateIds: ['duplicate-1', 'duplicate-3'],
        failedDuplicateIds: ['duplicate-2'],
      });

      expect(createStack).toHaveBeenCalledTimes(3);
      expect(updateAssets).toHaveBeenCalledTimes(3);
      expect(onError).toHaveBeenCalledWith('duplicate-2', error);
    });

    it('does not clear duplicate IDs when stack creation fails for a group', async () => {
      const error = new Error('failed to create stack');
      const createStack = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
      const updateAssets = vi.fn().mockResolvedValue(undefined);

      await expect(
        stackDuplicateGroups(
          [
            { duplicateId: 'duplicate-1', assetIds: ['asset-1', 'asset-2'] },
            { duplicateId: 'duplicate-2', assetIds: ['asset-3', 'asset-4'] },
          ],
          { createStack, updateAssets },
        ),
      ).resolves.toEqual({
        succeededDuplicateIds: ['duplicate-2'],
        failedDuplicateIds: ['duplicate-1'],
      });

      expect(updateAssets).toHaveBeenCalledTimes(1);
      expect(updateAssets).toHaveBeenCalledWith(['asset-3', 'asset-4']);
    });

    it('reports progress after each group finishes', async () => {
      const error = new Error('failed to create stack');
      const createStack = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(error);
      const updateAssets = vi.fn().mockResolvedValue(undefined);
      const onProgress = vi.fn();

      await stackDuplicateGroups(
        [
          { duplicateId: 'duplicate-1', assetIds: ['asset-1', 'asset-2'] },
          { duplicateId: 'duplicate-2', assetIds: ['asset-3', 'asset-4'] },
        ],
        { createStack, updateAssets, onProgress },
      );

      expect(onProgress).toHaveBeenNthCalledWith(1, {
        completedCount: 1,
        failedCount: 0,
        succeededCount: 1,
        totalCount: 2,
      });
      expect(onProgress).toHaveBeenNthCalledWith(2, {
        completedCount: 2,
        failedCount: 1,
        succeededCount: 1,
        totalCount: 2,
      });
    });
  });
});
