<script lang="ts">
  import { websocketStore } from '$lib/stores/websocket';
  import type { AssetStore } from '$lib/stores/assets.store';

  export let assetStore: AssetStore | null;
  let assetUpdateCount = 0;
  let lastAssetName: string;

  websocketStore.onAssetUpdate.subscribe((asset) => {
    if (asset && asset.originalFileName && assetStore) {
      lastAssetName = asset.originalFileName;
      assetUpdateCount++;

      assetStore.updateAsset(asset, true);

      assetStore.removeAsset(asset.id); // Update timeline
      assetStore.addAsset(asset);
    }
  });
</script>
