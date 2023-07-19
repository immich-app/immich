<script lang="ts">
  import { BucketPosition } from '$lib/models/asset-grid-state';
  import {
    assetInteractionStore,
    assetSelectionCandidates,
    assetSelectionStart,
    isMultiSelectStoreState,
    isViewingAssetStoreState,
    selectedAssets,
    viewingAssetStoreState,
  } from '$lib/stores/asset-interaction.store';
  import { assetGridState, assetStore, loadingBucketState } from '$lib/stores/assets.store';
  import { locale } from '$lib/stores/preferences.store';
  import { formatGroupTitle, splitBucketIntoDateGroups } from '$lib/utils/timeline-util';
  import type { UserResponseDto } from '@api';
  import { api, AssetCountByTimeBucketResponseDto, AssetResponseDto, TimeGroupEnum } from '@api';
  import { DateTime } from 'luxon';
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

  import { AppRoute } from '$lib/constants';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { isSearchEnabled } from '$lib/stores/search.store';

  export let user: UserResponseDto | undefined = undefined;
  export let isAlbumSelectionMode = false;
  export let showMemoryLane = false;

  let viewportHeight = 0;
  let viewportWidth = 0;
  let assetGridElement: HTMLElement;
  let bucketInfo: AssetCountByTimeBucketResponseDto;

  const onKeyboardPress = (event: KeyboardEvent) => handleKeyboardPress(event);

  onMount(async () => {
    document.addEventListener('keydown', onKeyboardPress);
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
    if (browser) {
      document.removeEventListener('keydown', onKeyboardPress);
    }

    assetStore.setInitialState(0, 0, { totalCount: 0, buckets: [] }, undefined);
  });

  const handleKeyboardPress = (event: KeyboardEvent) => {
    if ($isSearchEnabled) {
      return;
    }

    if (event.key === '/') {
      event.preventDefault();
    }

    if (!$isViewingAssetStoreState) {
      switch (event.key) {
        case '/':
          goto(AppRoute.EXPLORE);
          return;
      }
    }
  };

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
    if ($isSearchEnabled) {
      return;
    }

    if (e.shiftKey && e.key !== '/') {
      e.preventDefault();
      shiftKeyIsDown = true;
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if ($isSearchEnabled) {
      return;
    }

    if (e.shiftKey && e.key !== '/') {
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

  const handleSelectAssetCandidates = (e: CustomEvent) => {
    const asset = e.detail.asset;
    if (asset) {
      selectAssetCandidates(asset);
    }
    lastAssetMouseEvent = asset;
  };

  const handleSelectAssets = async (e: CustomEvent) => {
    const asset = e.detail.asset;
    if (!asset) {
      return;
    }

    const rangeSelection = $assetSelectionCandidates.size > 0;
    const deselect = $selectedAssets.has(asset);

    // Select/deselect already loaded assets
    if (deselect) {
      for (const candidate of $assetSelectionCandidates || []) {
        assetInteractionStore.removeAssetFromMultiselectGroup(candidate);
      }
      assetInteractionStore.removeAssetFromMultiselectGroup(asset);
    } else {
      for (const candidate of $assetSelectionCandidates || []) {
        assetInteractionStore.addAssetToMultiselectGroup(candidate);
      }
      assetInteractionStore.addAssetToMultiselectGroup(asset);
    }

    assetInteractionStore.clearAssetSelectionCandidates();

    if ($assetSelectionStart && rangeSelection) {
      let startBucketIndex = $assetGridState.loadedAssets[$assetSelectionStart.id];
      let endBucketIndex = $assetGridState.loadedAssets[asset.id];

      if (endBucketIndex < startBucketIndex) {
        [startBucketIndex, endBucketIndex] = [endBucketIndex, startBucketIndex];
      }

      // Select/deselect assets in all intermediate buckets
      for (let bucketIndex = startBucketIndex + 1; bucketIndex < endBucketIndex; bucketIndex++) {
        const bucket = $assetGridState.buckets[bucketIndex];
        await assetStore.getAssetsByBucket(bucket.bucketDate, BucketPosition.Unknown);
        for (const asset of bucket.assets) {
          if (deselect) {
            assetInteractionStore.removeAssetFromMultiselectGroup(asset);
          } else {
            assetInteractionStore.addAssetToMultiselectGroup(asset);
          }
        }
      }

      // Update date group selection
      for (let bucketIndex = startBucketIndex; bucketIndex <= endBucketIndex; bucketIndex++) {
        const bucket = $assetGridState.buckets[bucketIndex];

        // Split bucket into date groups and check each group
        const assetsGroupByDate = splitBucketIntoDateGroups(bucket.assets, $locale);

        for (const dateGroup of assetsGroupByDate) {
          const dateGroupTitle = formatGroupTitle(DateTime.fromISO(dateGroup[0].fileCreatedAt).startOf('day'));
          if (dateGroup.every((a) => $selectedAssets.has(a))) {
            assetInteractionStore.addGroupToMultiselectGroup(dateGroupTitle);
          } else {
            assetInteractionStore.removeGroupFromMultiselectGroup(dateGroupTitle);
          }
        }
      }
    }

    assetInteractionStore.setAssetSelectionStart(deselect ? null : asset);
  };

  const selectAssetCandidates = (asset: AssetResponseDto) => {
    if (!shiftKeyIsDown) {
      return;
    }

    const rangeStart = $assetSelectionStart;
    if (!rangeStart) {
      return;
    }

    let start = $assetGridState.assets.indexOf(rangeStart);
    let end = $assetGridState.assets.indexOf(asset);

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
  class="scrollbar-hidden mb-4 ml-4 mr-[60px] overflow-y-auto"
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
                on:selectAssets={handleSelectAssets}
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
