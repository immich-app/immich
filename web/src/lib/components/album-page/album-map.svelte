<script lang="ts">
  import { clickOutside } from '$lib/actions/click-outside';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import type Map from '$lib/components/shared-components/map/map.svelte';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import { timeToLoadTheMap } from '$lib/constants';
  import { albumMapViewManager } from '$lib/managers/album-view-map.manager.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { handlePromiseError } from '$lib/utils';
  import { delay } from '$lib/utils/asset-utils';
  import { navigate } from '$lib/utils/navigation';
  import { getAlbumInfo, type AlbumResponseDto, type MapMarkerResponseDto } from '@immich/sdk';
  import { LoadingSpinner, Modal, ModalBody } from '@immich/ui';
  import { mdiMapOutline } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    album: AlbumResponseDto;
  }

  let { album }: Props = $props();
  let abortController: AbortController;
  let { isViewing: showAssetViewer, asset: viewingAsset, setAssetId } = assetViewingStore;
  let viewingAssets: string[] = $state([]);
  let viewingAssetCursor = 0;

  let mapElement = $state<ReturnType<typeof Map>>();

  let zoom = $derived(1);
  let mapMarkers: MapMarkerResponseDto[] = $state([]);

  onMount(async () => {
    mapMarkers = await loadMapMarkers();
  });

  onDestroy(() => {
    abortController?.abort();
    assetViewingStore.showAssetViewer(false);
  });

  async function loadMapMarkers() {
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    let albumInfo: AlbumResponseDto = await getAlbumInfo({ id: album.id, withoutAssets: false });

    let markers: MapMarkerResponseDto[] = [];
    for (const asset of albumInfo.assets) {
      if (asset.exifInfo?.latitude && asset.exifInfo?.longitude) {
        markers.push({
          id: asset.id,
          lat: asset.exifInfo.latitude,
          lon: asset.exifInfo.longitude,
          city: asset.exifInfo?.city ?? null,
          country: asset.exifInfo?.country ?? null,
          state: asset.exifInfo?.state ?? null,
        });
      }
    }

    return markers;
  }

  function openMap() {
    albumMapViewManager.isInMapView = true;
  }

  function closeMap() {
    if (!$showAssetViewer) {
      albumMapViewManager.isInMapView = false;
    }
  }

  async function onViewAssets(assetIds: string[]) {
    viewingAssets = assetIds;
    viewingAssetCursor = 0;

    await setAssetId(assetIds[0]);
  }

  async function navigateNext() {
    if (viewingAssetCursor < viewingAssets.length - 1) {
      await setAssetId(viewingAssets[++viewingAssetCursor]);
      return true;
    }
    return false;
  }

  async function navigatePrevious() {
    if (viewingAssetCursor > 0) {
      await setAssetId(viewingAssets[--viewingAssetCursor]);
      return true;
    }
    return false;
  }

  async function navigateRandom() {
    if (viewingAssets.length <= 0) {
      return undefined;
    }
    const index = Math.floor(Math.random() * viewingAssets.length);
    const asset = await setAssetId(viewingAssets[index]);
    return asset;
  }
</script>

<CircleIconButton title={$t('map')} onclick={openMap} icon={mdiMapOutline} />

{#if albumMapViewManager.isInMapView}
  <div use:clickOutside={{ onOutclick: closeMap }}>
    <Modal title={$t('map')} size="medium" onClose={closeMap}>
      <ModalBody>
        <div class="flex flex-col w-full h-full gap-2 border border-gray-300 dark:border-light rounded-2xl">
          <div class="h-[500px] min-h-[300px] w-full">
            {#await import('../shared-components/map/map.svelte')}
              {#await delay(timeToLoadTheMap) then}
                <!-- show the loading spinner only if loading the map takes too much time -->
                <div class="flex items-center justify-center h-full w-full">
                  <LoadingSpinner />
                </div>
              {/await}
            {:then { default: Map }}
              <Map
                bind:this={mapElement}
                center={undefined}
                {zoom}
                clickable={false}
                bind:mapMarkers
                onSelect={onViewAssets}
                showSettings={false}
                rounded
              />
            {/await}
          </div>
        </div>
      </ModalBody>
    </Modal>
  </div>

  <Portal target="body">
    {#if $showAssetViewer}
      {#await import('../../../lib/components/asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
        <AssetViewer
          asset={$viewingAsset}
          showNavigation={viewingAssets.length > 1}
          onNext={navigateNext}
          onPrevious={navigatePrevious}
          onRandom={navigateRandom}
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
