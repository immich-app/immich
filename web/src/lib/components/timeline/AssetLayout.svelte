<script lang="ts">
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { filterIsInOrNearViewport } from '$lib/managers/timeline-manager/utils.svelte';
  import type { ViewerAsset } from '$lib/managers/timeline-manager/viewer-asset.svelte';
  import type { CommonPosition } from '$lib/utils/layout-utils';
  import type { Snippet } from 'svelte';
  import { flip } from 'svelte/animate';
  import { scale } from 'svelte/transition';

  type Props = {
    viewerAssets: ViewerAsset[];
    width: number;
    height: number;
    suspendTransitions: boolean;
    thumbnail: Snippet<
      [
        {
          asset: TimelineAsset;
          position: CommonPosition;
        },
      ]
    >;
    customThumbnailLayout?: Snippet<[asset: TimelineAsset]>;
  };

  const { viewerAssets, width, height, suspendTransitions, thumbnail, customThumbnailLayout }: Props = $props();
</script>

<!-- Image grid -->
<div data-image-grid class="relative overflow-clip" style:height={height + 'px'} style:width={width + 'px'}>
  {#each filterIsInOrNearViewport(viewerAssets) as viewerAsset (viewerAsset.id)}
    {@const position = viewerAsset.position!}
    {@const asset = viewerAsset.asset!}

    <!-- note: don't remove data-asset-id - its used by web e2e tests -->
    <!-- Be careful with $derived values in out:scale, because Svelte can retain DOM nodes -->
    <div
      data-asset-id={asset.id}
      class="absolute"
      style:top={position.top + 'px'}
      style:inset-inline-start={position.left + 'px'}
      style:width={position.width + 'px'}
      style:height={position.height + 'px'}
      out:scale|global={{ start: 0.1, duration: suspendTransitions ? 0 : 250 }}
      animate:flip={{ duration: suspendTransitions ? 0 : 150 }}
    >
      {@render thumbnail({ asset, position })}
      {@render customThumbnailLayout?.(asset)}
    </div>
  {/each}
</div>

<style>
  [data-image-grid] {
    user-select: none;
  }
</style>
