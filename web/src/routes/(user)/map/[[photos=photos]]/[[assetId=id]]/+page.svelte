<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import MapTimelinePanel from '$lib/components/shared-components/map/MapTimelinePanel.svelte';
  import type { SelectionBBox } from '$lib/components/shared-components/map/types';
  import { QueryParameter, timeToLoadTheMap } from '$lib/constants';
  import Portal from '$lib/elements/Portal.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { Route } from '$lib/route';
  import { handlePromiseError } from '$lib/utils';
  import { delay } from '$lib/utils/asset-utils';
  import { navigate } from '$lib/utils/navigation';
  import { IconButton } from '@immich/ui';
  import { mdiArrowLeft } from '@mdi/js';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import LoadingSpinner from '$lib/components/shared-components/LoadingSpinner.svelte';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const spaceId = $derived($page.url.searchParams.get(QueryParameter.SPACE_ID) || undefined);

  let selectedClusterIds = $state.raw(new Set<string>());
  let selectedClusterBBox = $state.raw<SelectionBBox>();
  let isTimelinePanelVisible = $state(false);

  function closeTimelinePanel() {
    isTimelinePanelVisible = false;
    selectedClusterBBox = undefined;
    selectedClusterIds = new Set();
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

{#if featureFlagsManager.value.map}
  <UserPageLayout title={data.meta.title}>
    {#snippet leading()}
      {#if spaceId}
        <IconButton
          variant="ghost"
          shape="round"
          color="secondary"
          aria-label={$t('back')}
          onclick={() => goto(`/spaces/${spaceId}`)}
          icon={mdiArrowLeft}
        />
      {/if}
    {/snippet}
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
          <Map hash onSelect={onViewAssets} {onClusterSelect} {spaceId} showSettings={!spaceId} />
        {/await}
      </div>

      {#if isTimelinePanelVisible && selectedClusterBBox}
        <div class="h-1/2 min-h-0 w-full pt-2 sm:h-full sm:w-1/3 sm:ps-2 sm:pt-0">
          <MapTimelinePanel
            bbox={selectedClusterBBox}
            {selectedClusterIds}
            assetCount={selectedClusterIds.size}
            onClose={closeTimelinePanel}
            {spaceId}
          />
        </div>
      {/if}
    </div>
  </UserPageLayout>
  <Portal target="body">
    {#if assetViewerManager.isViewing}
      {#await import('$lib/components/asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
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
