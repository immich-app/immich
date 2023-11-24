<script lang="ts">
  import { websocketStore } from '$lib/stores/websocket';
  import { AssetStore } from '$lib/stores/assets.store';
  import { notificationController, NotificationType } from './notification/notification';

  let assetStore = new AssetStore(/* vos options ici */);
  let assetUpdateCount = 0;
  let lastAssetName;
  let timeoutId;

  const subscribe = websocketStore.onAssetUpdate.subscribe(value => {
    if (value && value.originalFileName) {
      lastAssetName = value.originalFileName;
      assetUpdateCount++;

      assetStore.updateAsset(value);

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