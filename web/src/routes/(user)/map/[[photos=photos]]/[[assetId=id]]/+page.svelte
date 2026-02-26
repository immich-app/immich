<script lang="ts">
  import { goto } from '$app/navigation';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import MapTimelinePanel from '$lib/components/shared-components/map/MapTimelinePanel.svelte';
  import type { SelectionBBox } from '$lib/components/shared-components/map/types';
  import { timeToLoadTheMap } from '$lib/constants';
  import Portal from '$lib/elements/Portal.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { Route } from '$lib/route';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { handlePromiseError } from '$lib/utils';
  import { delay } from '$lib/utils/asset-utils';
  import { navigate } from '$lib/utils/navigation';
  import { LoadingSpinner } from '@immich/ui';
  import { onDestroy } from 'svelte';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let { isViewing: showAssetViewer, asset: viewingAsset, setAssetId } = assetViewingStore;

  let selectedClusterIds = $state.raw(new Set<string>());
  let selectedClusterBBox = $state.raw<SelectionBBox>();
  let isTimelinePanelVisible = $state(false);

  function closeTimelinePanel() {
    isTimelinePanelVisible = false;
    selectedClusterBBox = undefined;
    selectedClusterIds = new Set();
  }

  onDestroy(() => {
    assetViewingStore.showAssetViewer(false);
  });

  if (!featureFlagsManager.value.map) {
    handlePromiseError(goto(Route.photos()));
  }

  async function onViewAssets(assetIds: string[]) {
    await setAssetId(assetIds[0]);
    closeTimelinePanel();
  }

  function onClusterSelect(assetIds: string[], bbox: SelectionBBox) {
    selectedClusterIds = new Set(assetIds);
    selectedClusterBBox = bbox;
    isTimelinePanelVisible = true;
    assetViewingStore.showAssetViewer(false);
    handlePromiseError(navigate({ targetRoute: 'current', assetId: null }));
  }
</script>

{#if featureFlagsManager.value.map}
  <UserPageLayout title={data.meta.title}>
    <div class="isolate flex h-full w-full flex-col sm:flex-row">
      <div
        class={[
          'min-h-0',
          isTimelinePanelVisible ? 'h-1/2 w-full pb-2 sm:h-full sm:w-2/3 sm:pe-2 sm:pb-0' : 'h-full w-full',
        ]}
      >
        {#await import('$lib/components/shared-components/map/map.svelte')}
          {#await delay(timeToLoadTheMap) then}
            <!-- show the loading spinner only if loading the map takes too much time -->
            <div class="flex items-center justify-center h-full w-full">
              <LoadingSpinner />
            </div>
          {/await}
        {:then { default: Map }}
          <Map hash onSelect={onViewAssets} {onClusterSelect} />
        {/await}
      </div>

      {#if isTimelinePanelVisible && selectedClusterBBox}
        <div class="h-1/2 min-h-0 w-full pt-2 sm:h-full sm:w-1/3 sm:ps-2 sm:pt-0">
          <MapTimelinePanel
            bbox={selectedClusterBBox}
            {selectedClusterIds}
            assetCount={selectedClusterIds.size}
            onClose={closeTimelinePanel}
          />
        </div>
      {/if}
    </div>
  </UserPageLayout>
  <Portal target="body">
    {#if $showAssetViewer}
      {#await import('$lib/components/asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
        <AssetViewer
          cursor={{ current: $viewingAsset }}
          showNavigation={false}
          onClose={() => {
            assetViewingStore.showAssetViewer(false);
            handlePromiseError(navigate({ targetRoute: 'current', assetId: null }));
          }}
          isShared={false}
        />
      {/await}
    {/if}
  </Portal>
{/if}
