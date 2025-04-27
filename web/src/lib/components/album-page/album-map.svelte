<script lang="ts">
  import { clickOutside } from '$lib/actions/click-outside';
  import { delay } from '$lib/utils/asset-utils';
  import { timeToLoadTheMap } from '$lib/constants';
  import {
    getAlbumInfo,
    type AlbumResponseDto,
    type MapMarkerResponseDto,
  } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import type Map from '$lib/components/shared-components/map/map.svelte';
  import { LoadingSpinner } from '@immich/ui';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import { onDestroy, onMount } from 'svelte';
  import { mdiMap } from '@mdi/js';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { navigate } from '$lib/utils/navigation';
  import { handlePromiseError } from '$lib/utils';
  interface Point {
    lng: number;
    lat: number;
  }

  interface Props {
    album: AlbumResponseDto;
    isInMapView: boolean;
  }

  let { album, isInMapView = $bindable(false) }: Props = $props();
  let abortController: AbortController;
  let { isViewing: showAssetViewer, asset: viewingAsset, setAssetId } = assetViewingStore;
  let viewingAssets: string[] = $state([]);
  let viewingAssetCursor = 0;

  let showLoadingSpinner = $state(false);
  let mapElement = $state<ReturnType<typeof Map>>();

  let zoom = $derived(1);
  let mapMarkers: MapMarkerResponseDto[] = $state([]);



  onMount(async () => {
    mapMarkers = await loadMapMarkers();
  });

  onDestroy(() => {
    abortController?.abort();
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
    isInMapView = true;
  }

  function closeMap() {
    if(!$showAssetViewer){
      isInMapView = false;
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

<CircleIconButton title={$t('map')} onclick={openMap} icon={mdiMap} />

{#if isInMapView}
  <div use:clickOutside={{ onOutclick: closeMap }}>
    <FullScreenModal title={$t('map')} width="wide" onClose={closeMap}>
      <div class="flex flex-col w-full h-full gap-2">
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
            />
          {/await}
        </div>
      </div>
    </FullScreenModal>
  </div>
{/if}

{#if isInMapView}
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