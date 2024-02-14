<script lang="ts">
  import { goto } from '$app/navigation';
  import AssetViewer from '$lib/components/asset-viewer/asset-viewer.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import MapSettingsModal from '$lib/components/map-page/map-settings-modal.svelte';
  import Map from '$lib/components/shared-components/map/map.svelte';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import { AppRoute } from '$lib/constants';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import type { MapSettings } from '$lib/stores/preferences.store';
  import { mapSettings } from '$lib/stores/preferences.store';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { getMapMarkers, type MapMarkerResponseDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { DateTime, Duration } from 'luxon';
  import { onDestroy, onMount } from 'svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  let { isViewing: showAssetViewer, asset: viewingAsset } = assetViewingStore;

  let abortController: AbortController;
  let mapMarkers: MapMarkerResponseDto[] = [];
  let viewingAssets: string[] = [];
  let viewingAssetCursor = 0;
  let showSettingsModal = false;

  onMount(() => {
    loadMapMarkers().then((data) => (mapMarkers = data));
  });

  onDestroy(() => {
    abortController?.abort();
    assetViewingStore.showAssetViewer(false);
  });

  $: $featureFlags.map || goto(AppRoute.PHOTOS);
  const omit = (obj: MapSettings, key: string) => {
    return Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key));
  };

  async function loadMapMarkers() {
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    const { includeArchived, onlyFavorites, withPartners } = $mapSettings;
    const { fileCreatedAfter, fileCreatedBefore } = getFileCreatedDates();

    return await getMapMarkers(
      {
        isArchived: includeArchived && undefined,
        isFavorite: onlyFavorites || undefined,
        fileCreatedAfter: fileCreatedAfter || undefined,
        fileCreatedBefore,
        withPartners: withPartners || undefined,
      },
      {
        signal: abortController.signal,
      },
    );
  }

  function getFileCreatedDates() {
    const { relativeDate, dateAfter, dateBefore } = $mapSettings;

    if (relativeDate) {
      const duration = Duration.fromISO(relativeDate);
      return {
        fileCreatedAfter: duration.isValid ? DateTime.now().minus(duration).toISO() : undefined,
      };
    }

    try {
      return {
        fileCreatedAfter: dateAfter ? new Date(dateAfter).toISOString() : undefined,
        fileCreatedBefore: dateBefore ? new Date(dateBefore).toISOString() : undefined,
      };
    } catch {
      $mapSettings.dateAfter = '';
      $mapSettings.dateBefore = '';
      return {};
    }
  }

  function onViewAssets(assetIds: string[]) {
    assetViewingStore.setAssetId(assetIds[0]);
    viewingAssets = assetIds;
    viewingAssetCursor = 0;
  }

  function navigateNext() {
    if (viewingAssetCursor < viewingAssets.length - 1) {
      assetViewingStore.setAssetId(viewingAssets[++viewingAssetCursor]);
    }
  }

  function navigatePrevious() {
    if (viewingAssetCursor > 0) {
      assetViewingStore.setAssetId(viewingAssets[--viewingAssetCursor]);
    }
  }
</script>

{#if $featureFlags.loaded && $featureFlags.map}
  <UserPageLayout title={data.meta.title}>
    <div class="isolate h-full w-full">
      <Map bind:mapMarkers bind:showSettingsModal on:selected={(event) => onViewAssets(event.detail)} />
    </div></UserPageLayout
  >
  <Portal target="body">
    {#if $showAssetViewer}
      <AssetViewer
        asset={$viewingAsset}
        showNavigation={viewingAssets.length > 1}
        on:next={navigateNext}
        on:previous={navigatePrevious}
        on:close={() => assetViewingStore.showAssetViewer(false)}
        isShared={false}
      />
    {/if}
  </Portal>

  {#if showSettingsModal}
    <MapSettingsModal
      settings={{ ...$mapSettings }}
      on:close={() => (showSettingsModal = false)}
      on:save={async ({ detail }) => {
        const shouldUpdate = !isEqual(omit(detail, 'allowDarkMode'), omit($mapSettings, 'allowDarkMode'));
        showSettingsModal = false;
        $mapSettings = detail;

        if (shouldUpdate) {
          mapMarkers = await loadMapMarkers();
        }
      }}
    />
  {/if}
{/if}
