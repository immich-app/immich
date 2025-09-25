<script lang="ts">
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import Portal from '$lib/elements/Portal.svelte';
  import type { PhotostreamManager } from '$lib/managers/photostream-manager/PhotostreamManager.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { isAssetViewerRoute, navigate } from '$lib/utils/navigation';
  import { getSegmentIdentifier, getTimes } from '$lib/utils/timeline-util';
  import { DateTime } from 'luxon';
  import { type Snippet } from 'svelte';

  interface Props {
    timelineManager: PhotostreamManager;
    children?: Snippet;
    assetViewer: Snippet<[{ onViewerClose: (asset: { id: string }) => Promise<void> }]>;
    onAfterNavigateComplete: (args: { scrollToAssetQueryParam: boolean }) => void;
  }

  let { timelineManager, children, assetViewer, onAfterNavigateComplete }: Props = $props();

  let { isViewing: showAssetViewer, asset: viewingAsset, gridScrollTarget } = assetViewingStore;

  // tri-state boolean
  let initialLoadWasAssetViewer: boolean | null = null;
  let hasNavigatedToOrFromAssetViewer: boolean = false;
  let timelineScrollPositionInitialized = false;

  beforeNavigate(({ from, to }) => {
    timelineManager.suspendTransitions = true;
    hasNavigatedToOrFromAssetViewer = isAssetViewerRoute(to) || isAssetViewerRoute(from);
  });

  const completeAfterNavigate = () => {
    const assetViewerPage = !!(page.route.id?.endsWith('/[[assetId=id]]') && page.params.assetId);
    let isInitial = false;
    // Set initial load state only once
    if (initialLoadWasAssetViewer === null) {
      initialLoadWasAssetViewer = assetViewerPage && !hasNavigatedToOrFromAssetViewer;
      isInitial = true;
    }

    let scrollToAssetQueryParam = false;
    if (
      !timelineScrollPositionInitialized &&
      ((isInitial && !assetViewerPage) || // Direct timeline load
        (!isInitial && hasNavigatedToOrFromAssetViewer)) // Navigated from asset viewer
    ) {
      scrollToAssetQueryParam = true;
      timelineScrollPositionInitialized = true;
    }

    return onAfterNavigateComplete({ scrollToAssetQueryParam });
  };
  afterNavigate(({ complete }) => void complete.then(completeAfterNavigate, completeAfterNavigate));

  const onViewerClose = async (asset: { id: string }) => {
    assetViewingStore.showAssetViewer(false);
    $gridScrollTarget = { at: asset.id };
    await navigate({ targetRoute: 'current', assetId: null, assetGridRouteSearchParams: $gridScrollTarget });
  };

  $effect(() => {
    if ($showAssetViewer) {
      const { localDateTime } = getTimes($viewingAsset.fileCreatedAt, DateTime.local().offset / 60);
      void timelineManager.loadSegment(getSegmentIdentifier({ year: localDateTime.year, month: localDateTime.month }));
    }
  });
</script>

{@render children?.()}

<Portal target="body">
  {#if $showAssetViewer}
    {@render assetViewer({ onViewerClose })}
  {/if}
</Portal>
