<script lang="ts">
  import { websocketEvents } from '$lib/stores/websocket';
  import type { AssetStore } from '$lib/stores/assets.store';
  import { onMount } from 'svelte';

  export let assetStore: AssetStore | null;

  onMount(() => {
    return websocketEvents.on('on_asset_update', (asset) => {
      if (asset.originalFileName && assetStore) {
        assetStore.updateAsset(asset, true);

        assetStore.removeAsset(asset.id); // Update timeline
        assetStore.addAsset(asset);
      }
    });
  });
</script>
