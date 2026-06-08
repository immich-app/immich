<script lang="ts">
  import { goto } from '$app/navigation';
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import MapTimelinePanel from './MapTimelinePanel.svelte';
  import type { SelectionBBox } from '$lib/components/shared-components/map/types';
  import { timeToLoadTheMap } from '$lib/constants';
  import Portal from '$lib/elements/Portal.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { Route } from '$lib/route';
  import { handlePromiseError } from '$lib/utils';
  import { delay } from '$lib/utils/asset-utils';
  import { navigate } from '$lib/utils/navigation';
  import { Icon, LoadingSpinner } from '@immich/ui';
  import { mdiDragHorizontal } from '@mdi/js';
  import { onDestroy } from 'svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let selectedClusterIds = $state.raw(new Set<string>());
  let selectedClusterBBox = $state.raw<SelectionBBox>();

  let isTimelinePanelVisible = $state(false);

  const DEFAULT_PANEL_WIDTH = 384;
  const DESKTOP_PANEL_MIN_WIDTH = 320;
  const DESKTOP_PANEL_MAX_WIDTH = 700;
  let timelinePanelWidth = $state(DEFAULT_PANEL_WIDTH);

  let sheetHeight = $state(50);
  let isDraggingSheet = $state(false);
  let innerWidth = $state(1024);
  let isMobile = $derived(innerWidth < 768);

  const clampedTimelinePanelWidth = $derived(
    Math.min(Math.max(timelinePanelWidth, DESKTOP_PANEL_MIN_WIDTH), DESKTOP_PANEL_MAX_WIDTH),
  );

  let isResizingPanel = $state(false);
  let resizeStartX = $state(0);
  let resizeStartWidth = $state(0);

  function handleResizeStart(event: PointerEvent) {
    if (!isMobile) {
      event.preventDefault();
      isResizingPanel = true;
      resizeStartX = event.clientX;
      resizeStartWidth = timelinePanelWidth;
      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }
  }

  function handleResizeMove(event: PointerEvent) {
    if (!isResizingPanel) {
      return;
    }
    const deltaX = resizeStartX - event.clientX;
    const newWidth = resizeStartWidth + deltaX;
    timelinePanelWidth = Math.min(Math.max(newWidth, DESKTOP_PANEL_MIN_WIDTH), DESKTOP_PANEL_MAX_WIDTH);
  }

  function handleResizeEnd() {
    isResizingPanel = false;
  }

  function closeTimelinePanel() {
    isTimelinePanelVisible = false;
    selectedClusterBBox = undefined;
    selectedClusterIds = new Set();
    sheetHeight = 50;
  }

  function toggleTimeline() {
    isTimelinePanelVisible = !isTimelinePanelVisible;
    if (!isTimelinePanelVisible) {
      closeTimelinePanel();
    }
  }

  onDestroy(() => {
    assetViewerManager.showAssetViewer(false);
  });

  if (!featureFlagsManager.value.map) {
    handlePromiseError(goto(Route.photos()));
  }

  async function onViewAssets(assetIds: string[]) {
    await assetViewerManager.setAssetId(assetIds[0]);
    closeTimelinePanel();
  }

  function onClusterSelect(assetIds: string[], bbox: SelectionBBox) {
    selectedClusterIds = new Set(assetIds);
    selectedClusterBBox = bbox;
    isTimelinePanelVisible = true;
    assetViewerManager.showAssetViewer(false);
    handlePromiseError(navigate({ targetRoute: 'current', assetId: null }));
  }
</script>

<svelte:window bind:innerWidth onpointermove={handleResizeMove} onpointerup={handleResizeEnd} />

{#if featureFlagsManager.value.map}
  <UserPageLayout title={data.meta.title}>
    <div class="relative flex size-full overflow-hidden">
      <div class="min-w-0 flex-1 transition-all duration-300 ease-in-out">
        {#await Promise.all([import('$lib/components/shared-components/map/Map.svelte'), delay(timeToLoadTheMap)])}
          <div class="flex size-full items-center justify-center">
            <LoadingSpinner />
          </div>
        {:then [{ default: MapComponent }]}
          <MapComponent
            hash
            onSelect={onViewAssets}
            {onClusterSelect}
            isTimelineOpen={isTimelinePanelVisible}
            onToggleTimeline={toggleTimeline}
            {sheetHeight}
          />
        {/await}
      </div>

      {#if isTimelinePanelVisible}
        {#if !isMobile}
          <button
            type="button"
            class="pointer-events-auto absolute inset-y-0 z-20 flex w-6 cursor-col-resize items-center justify-center text-immich-primary transition-colors hover:text-immich-dark-primary"
            onpointerdown={handleResizeStart}
            aria-label="Drag to resize timeline panel"
            style:right={`${clampedTimelinePanelWidth}px`}
            title="Drag to resize timeline panel"
          >
            <span
              class="flex h-14 w-3 items-center justify-center rounded-full border border-gray-200 bg-white/90 shadow-md dark:border-immich-dark-gray dark:bg-immich-dark-bg"
            >
              <Icon icon={mdiDragHorizontal} size="16" />
            </span>
          </button>
        {/if}

        <aside
          class="absolute inset-x-0 bottom-0 z-30 flex w-full shrink-0 flex-col sm:relative sm:h-full sm:w-(--timeline-panel-width) sm:max-w-175 sm:min-w-[320px] sm:overflow-y-auto sm:border-s sm:border-gray-200 sm:bg-white sm:dark:border-immich-dark-gray sm:dark:bg-immich-dark-bg"
          style:--timeline-panel-width={isMobile ? '100%' : `${clampedTimelinePanelWidth}px`}
          transition:fly={{
            x: isMobile ? 0 : 400,
            y: isMobile ? 800 : 0,
            duration: 400,
            easing: cubicOut,
          }}
        >
          <MapTimelinePanel
            bbox={selectedClusterBBox}
            {selectedClusterIds}
            panelWidth={isMobile ? innerWidth : clampedTimelinePanelWidth}
            {isMobile}
            assetCount={selectedClusterIds.size}
            onClose={closeTimelinePanel}
            onSelect={onViewAssets}
            bind:sheetHeight
            bind:isDraggingSheet
          />
        </aside>
      {/if}
    </div>
  </UserPageLayout>
  <Portal target="body">
    {#if assetViewerManager.isViewing && !isTimelinePanelVisible}
      {#await import('$lib/components/asset-viewer/AssetViewer.svelte') then { default: AssetViewer }}
        <AssetViewer
          cursor={{ current: assetViewerManager.asset! }}
          showNavigation={false}
          onClose={() => {
            assetViewerManager.showAssetViewer(false);
            handlePromiseError(navigate({ targetRoute: 'current', assetId: null }));
          }}
          isShared={false}
        />
      {/await}
    {/if}
  </Portal>
{/if}
