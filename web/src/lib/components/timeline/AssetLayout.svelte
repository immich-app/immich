<script lang="ts">
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { filterIsInOrNearViewport } from '$lib/managers/timeline-manager/utils.svelte';
  import type { ViewerAsset } from '$lib/managers/timeline-manager/viewer-asset.svelte';
  import { uploadAssetsStore } from '$lib/stores/upload';
  import type { CommonPosition } from '$lib/utils/layout-utils';
  import type { Snippet } from 'svelte';
  import { flip } from 'svelte/animate';
  import { scale } from 'svelte/transition';

  let { isUploading } = uploadAssetsStore;

  type Props = {
    heroTransitionAssetId?: string | null;
    suspendTransitions?: boolean;
    viewerAssets: ViewerAsset[];
    width: number;
    height: number;
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

  const {
    heroTransitionAssetId,
    suspendTransitions = false,
    viewerAssets,
    width,
    height,
    thumbnail,
    customThumbnailLayout,
  }: Props = $props();

  const transitionDuration = $derived(suspendTransitions && !$isUploading ? 0 : 150);
  const scaleDuration = $derived(transitionDuration === 0 ? 0 : transitionDuration + 100);
</script>

<!-- Image grid -->
<div data-image-grid class="relative overflow-clip" style:height={height + 'px'} style:width={width + 'px'}>
  {#each filterIsInOrNearViewport(viewerAssets) as viewerAsset (viewerAsset.id)}
    {@const position = viewerAsset.position!}
    {@const asset = viewerAsset.asset!}
    {@const transitionName = heroTransitionAssetId === asset.id ? 'hero' : undefined}

    <!-- note: don't remove data-asset-id - its used by web e2e tests -->
    <div
      data-asset-id={asset.id}
      class="absolute"
      style:view-transition-name={transitionName}
      style:top={position.top + 'px'}
      style:inset-inline-start={position.left + 'px'}
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
