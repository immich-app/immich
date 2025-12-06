<script lang="ts">
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import type { ViewerAsset } from '$lib/managers/timeline-manager/viewer-asset.svelte';
  import type { VirtualScrollManager } from '$lib/managers/VirtualScrollManager/VirtualScrollManager.svelte';
  import { uploadAssetsStore } from '$lib/stores/upload';
  import type { CommonPosition } from '$lib/utils/layout-utils';
  import type { Snippet } from 'svelte';
  import { flip } from 'svelte/animate';

  let { isUploading } = uploadAssetsStore;

  type Props = {
    animationTargetAssetId?: string | null;
    viewerAssets: ViewerAsset[];
    width: number;
    height: number;
    manager: VirtualScrollManager;
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

  const { animationTargetAssetId, viewerAssets, width, height, manager, thumbnail, customThumbnailLayout }: Props =
    $props();

  const transitionDuration = $derived(manager.suspendTransitions && !$isUploading ? 0 : 150);
  const scaleDuration = $derived(transitionDuration === 0 ? 0 : transitionDuration + 100);

  const filterIntersecting = <T extends { intersecting: boolean }>(intersectables: T[]) => {
    return intersectables.filter(({ intersecting }) => intersecting);
  };
</script>

<!-- Image grid -->
<div data-image-grid class="relative overflow-clip" style:height={height + 'px'} style:width={width + 'px'}>
  {#each filterIntersecting(viewerAssets) as viewerAsset (viewerAsset.id)}
    {@const position = viewerAsset.position!}
    {@const asset = viewerAsset.asset!}
    {@const transitionName = animationTargetAssetId === asset.id ? 'hero' : undefined}

    <!-- note: don't remove data-asset-id - its used by web e2e tests -->
    <div
      data-asset-id={asset.id}
      class="absolute"
      style:view-transition-name={transitionName}
      style:top={position.top + 'px'}
      style:left={position.left + 'px'}
      style:width={position.width + 'px'}
      style:height={position.height + 'px'}
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
