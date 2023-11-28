<script lang="ts">
  import { websocketStore } from '$lib/stores/websocket';
  import type { AssetStore } from '$lib/stores/assets.store';
  import { notificationController, NotificationType } from './notification/notification';


  export let assetStore: AssetStore | null;
  let assetUpdateCount = 0;
  let lastAssetName: string;
  let timeoutId: string | number | NodeJS.Timeout | undefined;

  websocketStore.onAssetUpdate.subscribe(asset => {
    if (asset && asset.originalFileName && assetStore) {
      lastAssetName = asset.originalFileName;
      assetUpdateCount++;

      assetStore.updateAsset(asset,true);

      assetStore.removeAsset(asset.id); // Update timeline
      assetStore.addAsset(asset);

        clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (assetUpdateCount === 1) {
          
          notificationController.show({
            message: `Asset updated: ${lastAssetName}.`,
            type: NotificationType.Info,
          });
        } else {
          notificationController.show({
            message: `${assetUpdateCount} assets updated.\nPlease reload to apply changes`,
            type: NotificationType.Info,
          });
        }
        assetUpdateCount = 0;
      }, 500);
    }
  });

</script>