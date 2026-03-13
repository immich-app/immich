import { EditManager } from '$lib/managers/edit/edit-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { getFormatter } from '$lib/utils/i18n';
import { editAsset, getAssetInfo, removeAssetEdits } from '@immich/sdk';
import { toastManager } from '@immich/ui';
import { assetFactory } from '@test-data/factories/asset-factory';
import { websocketMock } from '@test-data/mocks/websocket.mock';
import type { MessageFormatter } from 'svelte-i18n';

vi.mock('@immich/sdk');
vi.mock('$lib/stores/websocket');
vi.mock('$lib/utils/i18n', () => ({
  getFormatter: vi.fn(),
  getPreferredLocale: vi.fn(),
}));
vi.mock('@immich/ui', () => ({
  toastManager: { success: vi.fn(), danger: vi.fn() },
  modalManager: { show: vi.fn() },
  ConfirmModal: {},
}));
vi.mock('$lib/managers/event-manager.svelte', () => ({
  eventManager: { emit: vi.fn(), on: vi.fn() },
}));
vi.mock('$lib/managers/edit/transform-manager.svelte', () => ({
  transformManager: {
    onActivate: vi.fn(),
    onDeactivate: vi.fn(),
    resetAllChanges: vi.fn(),
    hasChanges: false,
    canReset: false,
    edits: [],
  },
}));
vi.mock('$lib/components/asset-viewer/editor/transform-tool/transform-tool.svelte', () => ({
  default: {},
}));

describe('EditManager', () => {
  let editManager: EditManager;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getFormatter).mockResolvedValue(((key: string) => key) as MessageFormatter);
    websocketMock.waitForWebsocketEvent.mockResolvedValue(undefined as never);
    editManager = new EditManager();
  });

  describe('applyEdits', () => {
    it('should return false if no current asset', async () => {
      const result = await editManager.applyEdits();
      expect(result).toBe(false);
    });

    it('should call editAsset and emit AssetUpdate on success', async () => {
      const asset = assetFactory.build();
      const refreshedAsset = assetFactory.build({ id: asset.id, thumbhash: 'new-thumbhash' });
      vi.mocked(editAsset).mockResolvedValue(undefined as never);
      vi.mocked(getAssetInfo).mockResolvedValue(refreshedAsset);

      editManager.currentAsset = asset;
      const result = await editManager.applyEdits();

      expect(result).toBe(true);
      expect(getAssetInfo).toHaveBeenCalledWith({ id: asset.id });
      expect(eventManager.emit).toHaveBeenCalledWith('AssetUpdate', refreshedAsset);
      expect(eventManager.emit).toHaveBeenCalledWith('AssetEditsApplied', asset.id);
      expect(toastManager.success).toHaveBeenCalled();
    });

    it('should emit AssetUpdate before AssetEditsApplied', async () => {
      const asset = assetFactory.build();
      const refreshedAsset = assetFactory.build({ id: asset.id });
      vi.mocked(editAsset).mockResolvedValue(undefined as never);
      vi.mocked(getAssetInfo).mockResolvedValue(refreshedAsset);

      const emitCalls: string[] = [];
      vi.mocked(eventManager.emit).mockImplementation(((event: string) => {
        emitCalls.push(event);
      }) as typeof eventManager.emit);

      editManager.currentAsset = asset;
      await editManager.applyEdits();

      expect(emitCalls).toEqual(['AssetUpdate', 'AssetEditsApplied']);
    });

    it('should call removeAssetEdits when edits are empty', async () => {
      const asset = assetFactory.build();
      const refreshedAsset = assetFactory.build({ id: asset.id });
      vi.mocked(removeAssetEdits).mockResolvedValue(undefined as never);
      vi.mocked(getAssetInfo).mockResolvedValue(refreshedAsset);

      editManager.currentAsset = asset;
      // tools have empty edits by default from the mock
      const result = await editManager.applyEdits();

      expect(result).toBe(true);
      expect(removeAssetEdits).toHaveBeenCalledWith({ id: asset.id });
      expect(editAsset).not.toHaveBeenCalled();
    });

    it('should return false and show error toast on failure', async () => {
      const asset = assetFactory.build();
      vi.mocked(removeAssetEdits).mockRejectedValue(new Error('fail'));

      editManager.currentAsset = asset;
      const result = await editManager.applyEdits();

      expect(result).toBe(false);
      expect(toastManager.danger).toHaveBeenCalled();
      expect(eventManager.emit).not.toHaveBeenCalled();
    });

    it('should set hasAppliedEdits to true on success', async () => {
      const asset = assetFactory.build();
      const refreshedAsset = assetFactory.build({ id: asset.id });
      vi.mocked(editAsset).mockResolvedValue(undefined as never);
      vi.mocked(getAssetInfo).mockResolvedValue(refreshedAsset);

      editManager.currentAsset = asset;
      expect(editManager.hasAppliedEdits).toBe(false);

      await editManager.applyEdits();
      expect(editManager.hasAppliedEdits).toBe(true);
    });

    it('should set isApplyingEdits during the operation', async () => {
      const asset = assetFactory.build();
      const refreshedAsset = assetFactory.build({ id: asset.id });
      vi.mocked(editAsset).mockResolvedValue(undefined as never);
      vi.mocked(getAssetInfo).mockResolvedValue(refreshedAsset);

      editManager.currentAsset = asset;
      expect(editManager.isApplyingEdits).toBe(false);

      const promise = editManager.applyEdits();
      expect(editManager.isApplyingEdits).toBe(true);

      await promise;
      expect(editManager.isApplyingEdits).toBe(false);
    });
  });
});
