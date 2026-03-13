<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { mergeRotation } from '$lib/services/asset.service';
  import { waitForWebsocketEvent } from '$lib/stores/websocket';
  import { getAssetControlContext } from '$lib/utils/context';
  import { handleError } from '$lib/utils/handle-error';
  import { editAsset, getAssetEdits, getAssetInfo, removeAssetEdits } from '@immich/sdk';
  import { toastManager } from '@immich/ui';
  import { mdiRotateLeft, mdiRotateRight } from '@mdi/js';
  import { t } from 'svelte-i18n';

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const handleRotate = async (angle: number) => {
    try {
      const assets = [...getOwnedAssets()].filter((asset) => asset.isImage);
      if (assets.length === 0) {
        return;
      }

      let success = 0;
      let failed = 0;
      const pendingRefreshes: Promise<void>[] = [];

      for (const asset of assets) {
        try {
          const existing = await getAssetEdits({ id: asset.id });
          const edits = mergeRotation(
            existing.edits.map(({ action, parameters }) => ({ action, parameters })),
            angle,
          );

          const editCompleted = waitForWebsocketEvent(
            'AssetEditReadyV1',
            (event) => event.asset.id === asset.id,
            10_000,
          );

          await (edits.length === 0
            ? removeAssetEdits({ id: asset.id })
            : editAsset({ id: asset.id, assetEditsCreateDto: { edits } }));

          pendingRefreshes.push(
            editCompleted
              .then(() => getAssetInfo({ id: asset.id }))
              .then((refreshed) => void eventManager.emit('AssetUpdate', refreshed))
              .catch(() => {}),
          );
          success++;
        } catch {
          failed++;
        }
      }

      if (failed > 0) {
        toastManager.warning($t('rotated_count', { values: { count: success } }) + ` (${failed} ${$t('failed')})`);
      } else {
        toastManager.success($t('rotated_count', { values: { count: success } }));
      }

      clearSelect();

      // Refresh thumbnails in the background after edits complete
      void Promise.allSettled(pendingRefreshes);
    } catch (error) {
      handleError(error, $t('rotate_error'));
    }
  };
</script>

<MenuOption icon={mdiRotateRight} text={$t('rotate_right')} onClick={() => handleRotate(90)} />
<MenuOption icon={mdiRotateLeft} text={$t('rotate_left')} onClick={() => handleRotate(270)} />
<MenuOption icon={mdiRotateRight} text={$t('rotate_180')} onClick={() => handleRotate(180)} />
