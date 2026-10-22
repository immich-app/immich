<script lang="ts">
  import AssetLayout from '$lib/components/timeline/AssetLayout.svelte';
  import type { ViewerAsset } from '$lib/managers/timeline-manager/viewer-asset.svelte';
  import type { VirtualScrollManager } from '$lib/managers/VirtualScrollManager/VirtualScrollManager.svelte';

  interface Props {
    show: boolean;
    showDay?: boolean;
    viewerAssets: ViewerAsset[];
    manager: VirtualScrollManager;
  }

  let { show, showDay = true, viewerAssets, manager }: Props = $props();
</script>

{#if show}
  <section>
    {#if showDay}
      <AssetLayout {viewerAssets} {manager} width={300} height={100}>
        {#snippet thumbnail({ asset })}
          <button type="button">{asset.id}</button>
        {/snippet}
      </AssetLayout>
    {/if}
  </section>
{/if}
