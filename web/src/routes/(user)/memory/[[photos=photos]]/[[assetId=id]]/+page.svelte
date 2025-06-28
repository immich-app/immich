<script lang="ts">
  import MemoryViewer from '$lib/components/memory-page/memory-viewer.svelte';
  import { AssetManager } from '$lib/managers/asset-manager.svelte';
  import { onDestroy } from 'svelte';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const assetManager = new AssetManager();
  $effect(() => {
    if (data.assetId) {
      assetManager.showAssetViewer = true;
      void assetManager.updateOptions({ assetId: data.assetId });
    }
  });
  onDestroy(() => assetManager.destroy());
</script>

<MemoryViewer {assetManager} />
