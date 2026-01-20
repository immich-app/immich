<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import ChangeLocation from '$lib/components/shared-components/change-location.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import Timeline from '$lib/components/timeline/Timeline.svelte';
  import { AssetAction } from '$lib/constants';
  import type { DayGroup } from '$lib/managers/timeline-manager/day-group.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import GeolocationUpdateConfirmModal from '$lib/modals/GeolocationUpdateConfirmModal.svelte';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { cancelMultiselect } from '$lib/utils/asset-utils';
  import { setQueryValue } from '$lib/utils/navigation';
  import { AssetVisibility, reverseGeocode, updateAssets } from '@immich/sdk';
  import { Button, LoadingSpinner, modalManager, Text } from '@immich/ui';
  import { mdiContentCopy, mdiMapMarkerMultipleOutline, mdiPencilOutline, mdiSelectRemove } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let isLoading = $state(false);
  let assetInteraction = new AssetInteraction();
  let location = $state<{ latitude: number; longitude: number }>({ latitude: 0, longitude: 0 });
  let locationUpdated = $state(false);
  let selectedLocationName = $state('0.000, 0.000');
  let hasCityOrCountry = $state(false);
  let selectedCity = $state<string | null>(null);
  let selectedCountry = $state<string | null>(null);

  let timelineManager = $state<TimelineManager>() as TimelineManager;
  let showOnlyWithoutGps = $state(true);
  const getOptions = () => ({
    visibility: AssetVisibility.Timeline,
    withStacked: true,
    withPartners: true,
    withCoordinates: true,
    withoutGps: !!showOnlyWithoutGps,
  });

  const handleUpdate = async () => {
    const hasExistingLocations = assetInteraction.selectedAssets.some((asset) => asset.latitude || asset.longitude);

    const confirmed = await modalManager.show(GeolocationUpdateConfirmModal, {
      location: location ?? { latitude: 0, longitude: 0 },
      assetCount: assetInteraction.selectedAssets.length,
      locationName: hasCityOrCountry ? selectedLocationName : null,
      hasCityOrCountry,
      hasExistingLocations,
    });

    if (!confirmed) {
      return;
    }

    await updateAssets({
      assetBulkUpdateDto: {
        ids: assetInteraction.selectedAssets.map((asset) => asset.id),
        latitude: location?.latitude ?? undefined,
        longitude: location?.longitude ?? undefined,
      },
    });

    const assetsWithNewLocation = assetInteraction.selectedAssets.map((asset) => {
      return {
        ...asset,
        latitude: location.latitude,
        longitude: location.longitude,
        city: selectedCity,
        country: selectedCountry,
      };
    });

    timelineManager.upsertAssets(assetsWithNewLocation);

    handleDeselectAll();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Shift') {
      event.preventDefault();
    }
    if (event.key === 'Escape' && assetInteraction.selectionActive) {
      cancelMultiselect(assetInteraction);
    }
  };
  const onKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'Shift') {
      event.preventDefault();
    }
  };

  const handleDeselectAll = () => {
    cancelMultiselect(assetInteraction);
  };

  const updateLocationDisplay = (
    loc: { latitude: number; longitude: number },
    city?: string | null,
    country?: string | null,
  ) => {
    const fallback = `${loc.latitude.toFixed(3)}, ${loc.longitude.toFixed(3)}`;
    const hasData = !!(city || country);
    hasCityOrCountry = hasData;
    selectedCity = city ?? null;
    selectedCountry = country ?? null;

    if (city && country) {
      selectedLocationName = `${city}, ${country}`;
    } else if (city) {
      selectedLocationName = city;
    } else if (country) {
      selectedLocationName = country;
    } else {
      selectedLocationName = fallback;
    }
  };

  const handlePickOnMap = async () => {
    const point = await modalManager.show(ChangeLocation, {
      point: {
        lat: location.latitude,
        lng: location.longitude,
      },
    });
    if (!point) {
      return;
    }

    location = { latitude: point.lat, longitude: point.lng };
    const fallback = `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`;
    try {
      const places = await reverseGeocode({
        lat: point.lat,
        lon: point.lng,
      });
      updateLocationDisplay(location, places?.[0]?.city, places?.[0]?.country);
    } catch (error) {
      console.error('Failed to reverse geocode:', error);
      selectedCity = null;
      selectedCountry = null;
      hasCityOrCountry = false;
      selectedLocationName = fallback;
    }
  };

  const handleEscape = () => {
    if (assetInteraction.selectionActive) {
      assetInteraction.clearMultiselect();
      return;
    }
  };

  const hasGps = (asset: TimelineAsset) => {
    return !!asset.latitude && !!asset.longitude;
  };

  const handleThumbnailClick = (
    asset: TimelineAsset,
    timelineManager: TimelineManager,
    dayGroup: DayGroup,
    onClick: (
      timelineManager: TimelineManager,
      assets: TimelineAsset[],
      groupTitle: string,
      asset: TimelineAsset,
    ) => void,
  ) => {
    onClick(timelineManager, dayGroup.getAssets(), dayGroup.groupTitle, asset);
  };

  const onLocationInfoClick = (asset: TimelineAsset) => {
    if (!hasGps(asset)) {
      return;
    }
    locationUpdated = true;
    setTimeout(() => {
      locationUpdated = false;
    }, 1500);
    location = { latitude: asset.latitude!, longitude: asset.longitude! };
    updateLocationDisplay(location, asset.city, asset.country);
    void setQueryValue('at', asset.id);
  };
</script>

<svelte:document onkeydown={onKeyDown} onkeyup={onKeyUp} />

<UserPageLayout title={data.meta.title} scrollbar={true}>
  {#snippet buttons()}
    <div class="flex w-fit rounded-full bg-gray-200 p-1 text-sm font-medium font-mono overflow-hidden">
      <Button
        size="small"
        variant={showOnlyWithoutGps ? 'ghost' : 'filled'}
        color={showOnlyWithoutGps ? 'secondary' : 'primary'}
        class={`flex-1 px-4 py-1 text-center transition-colors duration-200 rounded-full ${!showOnlyWithoutGps ? 'bg-primary text-light' : ''}`}
        onclick={() => (showOnlyWithoutGps = false)}
      >
        <Text class="whitespace-nowrap">{$t('all')}</Text>
      </Button>
      <Button
        size="small"
        variant={showOnlyWithoutGps ? 'filled' : 'ghost'}
        color={showOnlyWithoutGps ? 'primary' : 'secondary'}
        class={`flex-1 px-4 py-1 text-center transition-colors duration-200 rounded-full ${showOnlyWithoutGps ? 'bg-primary text-light' : ''}`}
        onclick={() => (showOnlyWithoutGps = true)}
      >
        <Text class="whitespace-nowrap">{$t('no_gps')}</Text>
      </Button>
    </div>
    <div class="flex gap-2 justify-end place-items-center">
      <div class="border flex place-items-center place-content-center px-2 py-1 bg-primary/10 rounded-2xl">
        <Text class="hidden md:inline-block text-xs text-gray-500 font-mono mr-5 ml-2 uppercase">
          {$t('selected_gps_location')}
        </Text>
        <Text
          title={hasCityOrCountry
            ? `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`
            : $t('latitude_longitude')}
          class="rounded-3xl font-mono text-sm text-primary px-2 py-1 transition-all duration-100 ease-in-out {locationUpdated
            ? 'bg-primary/90 text-light font-semibold scale-105'
            : ''}">{selectedLocationName}</Text
        >
      </div>
      <Button
        size="small"
        color="secondary"
        variant="ghost"
        leadingIcon={mdiMapMarkerMultipleOutline}
        onclick={handlePickOnMap}
      >
        <Text class="hidden sm:inline-block">{$t('location_picker_choose_on_map')}</Text>
      </Button>
      <Button
        leadingIcon={mdiSelectRemove}
        size="small"
        color="secondary"
        variant="ghost"
        disabled={!assetInteraction.selectionActive}
        onclick={handleDeselectAll}
      >
        {$t('unselect_all')}
      </Button>
      <Button
        leadingIcon={mdiPencilOutline}
        size="small"
        color="primary"
        disabled={assetInteraction.selectedAssets.length === 0}
        onclick={() => handleUpdate()}
      >
        <Text class="hidden sm:inline-block">
          {$t('apply_count', { values: { count: assetInteraction.selectedAssets.length } })}
        </Text>
      </Button>
    </div>
  {/snippet}

  {#if isLoading}
    <div class="h-full w-full flex items-center justify-center">
      <LoadingSpinner size="giant" />
    </div>
  {/if}

  <Timeline
    isSelectionMode={true}
    enableRouting={true}
    bind:timelineManager
    options={getOptions()}
    {assetInteraction}
    removeAction={AssetAction.ARCHIVE}
    onEscape={handleEscape}
    withStacked
    onThumbnailClick={handleThumbnailClick}
  >
    {#snippet customThumbnailLayout(asset: TimelineAsset)}
      {#if hasGps(asset)}
        <button
          type="button"
          class="absolute bottom-1 end-3 px-4 py-1 rounded-xl text-xs transition-colors bg-success text-black flex items-center gap-2 cursor-pointer group hover:scale-110"
          onclick={() => onLocationInfoClick(asset)}
          title={$t('copy_location_coordinates')}
        >
          <div class="flex-grow">
            {#if asset.city && asset.country}
              {asset.city}, {asset.country}
            {:else if asset.city}
              {asset.city}
            {:else if asset.country}
              {asset.country}
            {:else}
              {$t('gps')}
            {/if}
          </div>

          <svg class="h-4 w-4" viewBox="0 0 24 24">
            <path fill="currentColor" d={mdiContentCopy} />
          </svg>
        </button>
      {:else}
        <div class="absolute bottom-1 end-3 px-4 py-1 rounded-xl text-xs transition-colors bg-danger text-light">
          {$t('gps_missing')}
        </div>
      {/if}
    {/snippet}
    {#snippet empty()}
      <EmptyPlaceholder text={$t('no_assets_message')} onClick={() => {}} class="mt-10 mx-auto" />
    {/snippet}
  </Timeline>
</UserPageLayout>
