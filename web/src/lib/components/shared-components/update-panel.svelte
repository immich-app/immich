<script lang="ts">
  import { websocketStore } from '$lib/stores/websocket';
  import type { AssetStore } from '$lib/stores/assets.store';

  export let assetStore: AssetStore | null;

  websocketStore.onAssetUpdate.subscribe((asset) => {
    if (asset && asset.originalFileName && assetStore) {
      assetStore.updateAsset(asset, true);

      assetStore.removeAsset(asset.id); // Update timeline
      assetStore.addAsset(asset);
    }
  });
</script>
