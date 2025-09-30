<script lang="ts">
  import { uploadAssetsStore } from '$lib/stores/upload';

  import { flip } from 'svelte/animate';
  import { scale } from 'svelte/transition';

  import type { PhotostreamManager } from '$lib/managers/photostream-manager/PhotostreamManager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import type { ViewerAsset } from '$lib/managers/timeline-manager/viewer-asset.svelte';
  import type { CommonPosition } from '$lib/utils/layout-utils';
  import type { Snippet } from 'svelte';

  let { isUploading } = uploadAssetsStore;

  interface Props {
    viewerAssets: ViewerAsset[];
    width: number;
    height: number;
    photostreamManager: PhotostreamManager;
    thumbnail: Snippet<
      [
        {
          asset: TimelineAsset;
          position: CommonPosition;
        },
      ]
    >;
    customThumbnailLayout?: Snippet<[asset: TimelineAsset]>;
  }

  let { viewerAssets, width, height, photostreamManager, thumbnail, customThumbnailLayout }: Props = $props();

  const transitionDuration = $derived.by(() => (photostreamManager.suspendTransitions && !$isUploading ? 0 : 150));
  const scaleDuration = $derived(transitionDuration === 0 ? 0 : transitionDuration + 100);

  function filterIntersecting<R extends { intersecting: boolean }>(intersectables: R[]) {
    return intersectables.filter((intersectable) => intersectable.intersecting);
  }
</script>

<!-- Image grid -->
<div data-image-grid class="relative overflow-clip" style:height={height + 'px'} style:width={width + 'px'}>
  {#each filterIntersecting(viewerAssets) as viewerAsset (viewerAsset.id)}
    {@const position = viewerAsset.position!}
    {@const asset = viewerAsset.asset!}

    <!-- note: don't remove data-asset-id - its used by web e2e tests -->
    <div
      data-asset-id={asset.id}
      class="absolute"
      style:top={position.top + 'px'}
      style:left={position.left + 'px'}
      style:width={position.width + 'px'}
      style:height={position.height + 'px'}
      out:scale|global={{ start: 0.1, duration: scaleDuration }}
      animate:flip={{ duration: transitionDuration }}
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
