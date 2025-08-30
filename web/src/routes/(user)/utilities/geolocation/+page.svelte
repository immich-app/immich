<script lang="ts">
  import emptyUrl from '$lib/assets/empty-5.svg';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import ChangeLocation from '$lib/components/shared-components/change-location.svelte';
  import DatePicker from '$lib/components/shared-components/date-picker.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import Geolocation from '$lib/components/utilities-page/geolocation/geolocation.svelte';
  import GeolocationUpdateConfirmModal from '$lib/modals/GeolocationUpdateConfirmModal.svelte';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { cancelMultiselect } from '$lib/utils/asset-utils';
  import { buildDateRangeFromYearMonthAndDay } from '$lib/utils/date-time';
  import { setQueryValue } from '$lib/utils/navigation';
  import { buildDateString } from '$lib/utils/string-utils';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { searchAssets, updateAssets, type AssetResponseDto } from '@immich/sdk';
  import { Button, LoadingSpinner, modalManager, Text } from '@immich/ui';
  import {
    mdiMapMarkerMultipleOutline,
    mdiMapMarkerOff,
    mdiPencilOutline,
    mdiSelectAll,
    mdiSelectRemove,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let partialDate = $state<string | null>(data.partialDate);
  let isLoading = $state(false);
  let assets = $state<AssetResponseDto[]>([]);
  let shiftKeyIsDown = $state(false);
  let assetInteraction = new AssetInteraction();
  let location = $state<{ latitude: number; longitude: number }>({ latitude: 0, longitude: 0 });
  let assetsToDisplay = $state(500);
  let takenRange = $state<{ takenAfter?: string; takenBefore?: string } | null>(null);
  let locationUpdated = $state(false);
  let showOnlyAssetsWithoutLocation = $state(false);

  // Filtered assets based on location filter
  let filteredAssets = $derived(
    showOnlyAssetsWithoutLocation
      ? assets.filter((asset) => !asset.exifInfo?.latitude || !asset.exifInfo?.longitude)
      : assets,
  );

  void init();

  async function init() {
    if (partialDate) {
      const [year, month, day] = partialDate.split('-');
      const { from: takenAfter, to: takenBefore } = buildDateRangeFromYearMonthAndDay(
        Number.parseInt(year),
        Number.parseInt(month),
        Number.parseInt(day),
      );
      takenRange = { takenAfter, takenBefore };
      const dateString = buildDateString(Number.parseInt(year), Number.parseInt(month), Number.parseInt(day));
      await setQueryValue('date', dateString);
      await loadAssets();
    }
  }

  const loadAssets = async () => {
    if (takenRange) {
      isLoading = true;

      const searchResult = await searchAssets({
        metadataSearchDto: {
          withExif: true,
          takenAfter: takenRange.takenAfter,
          takenBefore: takenRange.takenBefore,
          size: assetsToDisplay,
        },
      });

      assets = searchResult.assets.items;
      isLoading = false;
    }
  };

  const handleDateChange = async (selectedYear?: number, selectedMonth?: number, selectedDay?: number) => {
    partialDate = selectedYear ? buildDateString(selectedYear, selectedMonth, selectedDay) : null;
    if (!selectedYear) {
      assets = [];
      return;
    }
    try {
      const { from: takenAfter, to: takenBefore } = buildDateRangeFromYearMonthAndDay(
        selectedYear,
        selectedMonth,
        selectedDay,
      );
      const dateString = buildDateString(selectedYear, selectedMonth, selectedDay);
      takenRange = { takenAfter, takenBefore };
      await setQueryValue('date', dateString);
      await loadAssets();
    } catch (error) {
      console.error('Failed to filter assets by date:', error);
    }
  };

  const handleClearFilters = async () => {
    assets = [];
    assetInteraction.clearMultiselect();
    await setQueryValue('date', '');
  };

  const toggleLocationFilter = () => {
    showOnlyAssetsWithoutLocation = !showOnlyAssetsWithoutLocation;
  };

  const handleUpdate = async () => {
    const confirmed = await modalManager.show(GeolocationUpdateConfirmModal, {
      location: location ?? { latitude: 0, longitude: 0 },
      assetCount: assetInteraction.selectedAssets.length,
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

    void loadAssets();
    handleDeselectAll();
  };

  // Assets selection handlers
  // TODO: might be refactored to use the same logic as in asset-grid.svelte and gallery-viewer.svelte
  const handleSelectAssets = (asset: AssetResponseDto) => {
    const timelineAsset = toTimelineAsset(asset);
    const deselect = assetInteraction.hasSelectedAsset(asset.id);

    if (deselect) {
      for (const candidate of assetInteraction.assetSelectionCandidates) {
        assetInteraction.removeAssetFromMultiselectGroup(candidate.id);
      }
      assetInteraction.removeAssetFromMultiselectGroup(asset.id);
    } else {
      for (const candidate of assetInteraction.assetSelectionCandidates) {
        assetInteraction.selectAsset(candidate);
      }
      assetInteraction.selectAsset(timelineAsset);
    }

    assetInteraction.clearAssetSelectionCandidates();
    assetInteraction.setAssetSelectionStart(deselect ? null : timelineAsset);
  };

  const selectAssetCandidates = (endAsset: AssetResponseDto) => {
    if (!shiftKeyIsDown) {
      return;
    }

    const startAsset = assetInteraction.assetSelectionStart;
    if (!startAsset) {
      return;
    }

    let start = assets.findIndex((a) => a.id === startAsset.id);
    let end = assets.findIndex((a) => a.id === endAsset.id);

    if (start > end) {
      [start, end] = [end, start];
    }

    assetInteraction.setAssetSelectionCandidates(assets.slice(start, end + 1).map((a) => toTimelineAsset(a)));
  };
  const assetMouseEventHandler = (asset: AssetResponseDto) => {
    if (assetInteraction.selectionActive) {
      selectAssetCandidates(asset);
    }
  };
  // Keyboard handlers
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Shift') {
      event.preventDefault();
      shiftKeyIsDown = true;
    }
    if (event.key === 'Escape' && assetInteraction.selectionActive) {
      cancelMultiselect(assetInteraction);
    }
  };
  const onKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'Shift') {
      event.preventDefault();
      shiftKeyIsDown = false;
    }
  };
  const handleSelectAll = () => {
    assetInteraction.selectAssets(filteredAssets.map((a) => toTimelineAsset(a)));
  };
  const handleDeselectAll = () => {
    cancelMultiselect(assetInteraction);
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
  };
</script>

<svelte:document onkeydown={onKeyDown} onkeyup={onKeyUp} />

<UserPageLayout title={data.meta.title} scrollbar={true}>
  {#snippet buttons()}
    <div class="flex gap-2 justify-end place-items-center">
      {#if filteredAssets.length > 0}
        <Text class="hidden md:block text-xs mr-4 text-dark/50">{$t('geolocation_instruction_location')}</Text>
      {/if}
      <div class="border flex place-items-center place-content-center px-2 py-1 bg-primary/10 rounded-2xl">
        <p class="text-xs text-gray-500 font-mono mr-5 ml-2 uppercase">{$t('selected_gps_coordinates')}</p>
        <Text
          title="latitude, longitude"
          class="rounded-3xl font-mono text-sm text-primary px-2 py-1 transition-all duration-100 ease-in-out {locationUpdated
            ? 'bg-primary/90 text-light font-semibold scale-105'
            : ''}">{location.latitude.toFixed(3)}, {location.longitude.toFixed(3)}</Text
        >
      </div>

      <Button size="small" color="secondary" variant="ghost" leadingIcon={mdiPencilOutline} onclick={handlePickOnMap}
        >{$t('location_picker_choose_on_map')}</Button
      >
      <Button
        leadingIcon={mdiMapMarkerMultipleOutline}
        size="small"
        color="primary"
        disabled={assetInteraction.selectedAssets.length === 0}
        onclick={() => handleUpdate()}
      >
        {$t('apply_count', { values: { count: assetInteraction.selectedAssets.length } })}
      </Button>
    </div>
  {/snippet}

  <div class="bg-light flex items-center justify-between flex-wrap border-b">
    <div class="flex gap-2 items-center">
      <DatePicker
        onDateChange={handleDateChange}
        onClearFilters={handleClearFilters}
        defaultDate={partialDate || undefined}
      />
    </div>

    <div class="flex gap-2">
      <Button
        size="small"
        leadingIcon={showOnlyAssetsWithoutLocation ? mdiMapMarkerMultipleOutline : mdiMapMarkerOff}
        color={showOnlyAssetsWithoutLocation ? 'primary' : 'secondary'}
        variant="ghost"
        onclick={toggleLocationFilter}
      >
        {showOnlyAssetsWithoutLocation ? $t('show_all_assets') : $t('show_assets_without_location')}
      </Button>
      <Button
        leadingIcon={assetInteraction.selectionActive ? mdiSelectRemove : mdiSelectAll}
        size="small"
        color="secondary"
        variant="ghost"
        onclick={assetInteraction.selectionActive ? handleDeselectAll : handleSelectAll}
      >
        {assetInteraction.selectionActive ? $t('unselect_all') : $t('select_all')}
      </Button>
    </div>
  </div>

  {#if isLoading}
    <div class="h-full w-full flex items-center justify-center">
      <LoadingSpinner size="giant" />
    </div>
  {/if}

  {#if filteredAssets && filteredAssets.length > 0}
    <div class="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 mt-4">
      {#each filteredAssets as asset (asset.id)}
        <Geolocation
          {asset}
          {assetInteraction}
          onSelectAsset={(asset) => handleSelectAssets(asset)}
          onMouseEvent={(asset) => assetMouseEventHandler(asset)}
          onLocation={(selected) => {
            location = selected;
            locationUpdated = true;
            setTimeout(() => {
              locationUpdated = false;
            }, 1000);
          }}
        />
      {/each}
    </div>
  {:else}
    <div class="w-full">
      {#if partialDate == null}
        <EmptyPlaceholder text={$t('geolocation_instruction_no_date')} src={emptyUrl} />
      {:else if showOnlyAssetsWithoutLocation && filteredAssets.length === 0 && assets.length > 0}
        <EmptyPlaceholder text={$t('geolocation_instruction_all_have_location')} src={emptyUrl} />
      {:else}
        <EmptyPlaceholder text={$t('geolocation_instruction_no_photos')} src={emptyUrl} />
      {/if}
    </div>
  {/if}
</UserPageLayout>
