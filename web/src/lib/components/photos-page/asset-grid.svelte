<script lang="ts">
  import { BucketPosition } from '$lib/models/asset-grid-state';
  import {
    assetInteractionStore,
    isMultiSelectStoreState,
    isViewingAssetStoreState,
    selectedAssets,
    viewingAssetStoreState,
  } from '$lib/stores/asset-interaction.store';
  import { assetGridState, assetStore, loadingBucketState } from '$lib/stores/assets.store';
  import type { UserResponseDto } from '@api';
  import { api, AssetCountByTimeBucketResponseDto, AssetResponseDto, TimeGroupEnum } from '@api';
  import { onDestroy, onMount } from 'svelte';
  import AssetViewer from '../asset-viewer/asset-viewer.svelte';
  import IntersectionObserver from '../asset-viewer/intersection-observer.svelte';
  import Portal from '../shared-components/portal/portal.svelte';
  import Scrollbar, {
    OnScrollbarClickDetail,
    OnScrollbarDragDetail,
  } from '../shared-components/scrollbar/scrollbar.svelte';
  import AssetDateGroup from './asset-date-group.svelte';
  import MemoryLane from './memory-lane.svelte';

  export let user: UserResponseDto | undefined = undefined;
  export let isAlbumSelectionMode = false;
  export let showMemoryLane = false;

  let viewportHeight = 0;
  let viewportWidth = 0;
  let assetGridElement: HTMLElement;
  let bucketInfo: AssetCountByTimeBucketResponseDto;

  onMount(async () => {
    const { data: assetCountByTimebucket } = await api.assetApi.getAssetCountByTimeBucket({
      getAssetCountByTimeBucketDto: {
        timeGroup: TimeGroupEnum.Month,
        userId: user?.id,
        withoutThumbs: true,
      },
    });

    bucketInfo = assetCountByTimebucket;

    assetStore.setInitialState(viewportHeight, viewportWidth, assetCountByTimebucket, user?.id);

    // Get asset bucket if bucket height is smaller than viewport height
    let bucketsToFetchInitially: string[] = [];
    let initialBucketsHeight = 0;
    $assetGridState.buckets.every((bucket) => {
      if (initialBucketsHeight < viewportHeight) {
        initialBucketsHeight += bucket.bucketHeight;
        bucketsToFetchInitially.push(bucket.bucketDate);
        return true;
      } else {
        return false;
      }
    });

    bucketsToFetchInitially.forEach((bucketDate) => {
      assetStore.getAssetsByBucket(bucketDate, BucketPosition.Visible);
    });
  });

  onDestroy(() => {
    assetStore.setInitialState(0, 0, { totalCount: 0, buckets: [] }, undefined);
  });

  function intersectedHandler(event: CustomEvent) {
    const el = event.detail.container as HTMLElement;
    const target = el.firstChild as HTMLElement;
    if (target) {
      const bucketDate = target.id.split('_')[1];
      assetStore.getAssetsByBucket(bucketDate, event.detail.position);
    }
  }

  function handleScrollTimeline(event: CustomEvent) {
    assetGridElement.scrollBy(0, event.detail.heightDelta);
  }

  const navigateToPreviousAsset = () => {
    assetInteractionStore.navigateAsset('previous');
  };

  const navigateToNextAsset = () => {
    assetInteractionStore.navigateAsset('next');
  };

  let lastScrollPosition = 0;
  let animationTick = false;

  const handleTimelineScroll = () => {
    if (!animationTick) {
      window.requestAnimationFrame(() => {
        lastScrollPosition = assetGridElement?.scrollTop;
        animationTick = false;
      });

      animationTick = true;
    }
  };

  const handleScrollbarClick = (e: OnScrollbarClickDetail) => {
    assetGridElement.scrollTop = e.scrollTo;
  };

  const handleScrollbarDrag = (e: OnScrollbarDragDetail) => {
    assetGridElement.scrollTop = e.scrollTo;
  };

  const handleArchiveSuccess = (e: CustomEvent) => {
    const asset = e.detail as AssetResponseDto;
    navigateToNextAsset();
    assetStore.removeAsset(asset.id);
  };

  let lastAssetMouseEvent: AssetResponseDto | null = null;

  $: if (!lastAssetMouseEvent) {
    assetInteractionStore.clearAssetSelectionCandidates();
  }

  let shiftKeyIsDown = false;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      e.preventDefault();
      shiftKeyIsDown = true;
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      e.preventDefault();
      shiftKeyIsDown = false;
    }
  };

  $: if (!shiftKeyIsDown) {
    assetInteractionStore.clearAssetSelectionCandidates();
  }

  $: if (shiftKeyIsDown && lastAssetMouseEvent) {
    selectAssetCandidates(lastAssetMouseEvent);
  }

  const getLastSelectedAsset = () => {
    let value;
    for (value of $selectedAssets);
    return value;
  };

  const handleSelectAssetCandidates = (e: CustomEvent) => {
    const asset = e.detail.asset;
    if (asset) {
      selectAssetCandidates(asset);
    }
    lastAssetMouseEvent = asset;
  };

  const selectAssetCandidates = (asset: AssetResponseDto) => {
    if (!shiftKeyIsDown) {
      return;
    }

    const lastSelectedAsset = getLastSelectedAsset();
    if (!lastSelectedAsset) {
      return;
    }

    let start = $assetGridState.assets.indexOf(asset);
    let end = $assetGridState.assets.indexOf(lastSelectedAsset);

    if (start > end) {
      [start, end] = [end, start];
    }

    assetInteractionStore.setAssetSelectionCandidates($assetGridState.assets.slice(start, end + 1));
  };

  const onSelectStart = (e: Event) => {
    if ($isMultiSelectStoreState && shiftKeyIsDown) {
      e.preventDefault();
    }
  };
</script>

<svelte:window on:keydown={onKeyDown} on:keyup={onKeyUp} on:selectstart={onSelectStart} />

{#if bucketInfo && viewportHeight && $assetGridState.timelineHeight > viewportHeight}
  <Scrollbar
    scrollbarHeight={viewportHeight}
    scrollTop={lastScrollPosition}
    on:onscrollbarclick={(e) => handleScrollbarClick(e.detail)}
    on:onscrollbardrag={(e) => handleScrollbarDrag(e.detail)}
  />
{/if}

<!-- Right margin MUST be equal to the width of immich-scrubbable-scrollbar -->
<section
  id="asset-grid"
  class="overflow-y-auto ml-4 mb-4 mr-[60px] scrollbar-hidden"
  bind:clientHeight={viewportHeight}
  bind:clientWidth={viewportWidth}
  bind:this={assetGridElement}
  on:scroll={handleTimelineScroll}
>
  {#if assetGridElement}
    {#if showMemoryLane}
      <MemoryLane />
    {/if}
    <section id="virtual-timeline" style:height={$assetGridState.timelineHeight + 'px'}>
      {#each $assetGridState.buckets as bucket, bucketIndex (bucketIndex)}
        <IntersectionObserver
          on:intersected={intersectedHandler}
          on:hidden={async () => {
            // If bucket is hidden and in loading state, cancel the request
            if ($loadingBucketState[bucket.bucketDate]) {
              await assetStore.cancelBucketRequest(bucket.cancelToken, bucket.bucketDate);
            }
          }}
          let:intersecting
          top={750}
          bottom={750}
          root={assetGridElement}
        >
          <div id={'bucket_' + bucket.bucketDate} style:height={bucket.bucketHeight + 'px'}>
            {#if intersecting}
              <AssetDateGroup
                {isAlbumSelectionMode}
                on:shift={handleScrollTimeline}
                on:selectAssetCandidates={handleSelectAssetCandidates}
                assets={bucket.assets}
                bucketDate={bucket.bucketDate}
                bucketHeight={bucket.bucketHeight}
                {viewportWidth}
              />
            {/if}
          </div>
        </IntersectionObserver>
      {/each}
    </section>
  {/if}
</section>

<Portal target="body">
  {#if $isViewingAssetStoreState}
    <AssetViewer
      asset={$viewingAssetStoreState}
      on:navigate-previous={navigateToPreviousAsset}
      on:navigate-next={navigateToNextAsset}
      on:close={() => {
        assetInteractionStore.setIsViewingAsset(false);
      }}
      on:archived={handleArchiveSuccess}
    />
  {/if}
</Portal>

<style>
  #asset-grid {
    contain: layout;
    scrollbar-width: none;
  }
</style>
