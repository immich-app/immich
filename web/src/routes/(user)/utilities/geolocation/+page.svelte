<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import CoordinatesInput from '$lib/components/shared-components/coordinates-input.svelte';
  import DatePicker from '$lib/components/shared-components/date-picker.svelte';
  import NumberRangeInput from '$lib/components/shared-components/number-range-input.svelte';
  import Geolocation from '$lib/components/utilities-page/geolocation/geolocation.svelte';
  import GeolocationInformationModal from '$lib/modals/GeolocationInformationModal.svelte';
  import GeolocationUpdateConfirmationModal from '$lib/modals/GeolocationUpdateConfirmationModal.svelte';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { cancelMultiselect } from '$lib/utils/asset-utils';
  import { buildDateRangeFromYearMonthAndDay } from '$lib/utils/date-time';
  import { setQueryValue } from '$lib/utils/navigation';
  import { buildDateString } from '$lib/utils/string-utils';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { searchAssets, updateAssets, type AssetResponseDto } from '@immich/sdk';
  import { Button, IconButton, LoadingSpinner, modalManager } from '@immich/ui';
  import { mdiInformationOutline, mdiMapMarkerRadius, mdiSelectAll, mdiSelectRemove } from '@mdi/js';
  import { debounce } from 'lodash-es';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  const partialDate = data.partialDate;

  let isLoading = $state(false);
  let assets = $state<AssetResponseDto[]>([]);
  let shiftKeyIsDown = $state(false);
  let assetInteraction = new AssetInteraction();
  let location = $state<{ latitude: number | undefined; longitude: number | undefined } | null>(null);
  let assetsStats = $state({ displayed: 0, total: 0 });
  let assetsToDisplay = $state(200);
  let takenRange = $state<{ takenAfter?: string; takenBefore?: string } | null>(null);

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
      assetsStats = {
        displayed: assets.length,
        total: searchResult.assets.total,
      };
      isLoading = false;
    }
  };

  const handleDateChange = async (selectedYear?: number, selectedMonth?: number, selectedDay?: number) => {
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

  const onLocationClick = (locationFromAsset: { latitude: number | undefined; longitude: number | undefined }) => {
    location = locationFromAsset;
  };

  const onUpdateLocation = async () => {
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

  const debouncedLoadAssets = debounce(loadAssets, 400);

  const handleAssetsToDisplayInput = (value: number | null) => {
    if (value === null) {
      return;
    }
    assetsToDisplay = value;
    void debouncedLoadAssets();
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
    assetInteraction.selectAssets(assets.map((a) => toTimelineAsset(a)));
  };
  const handleDeselectAll = () => {
    cancelMultiselect(assetInteraction);
  };
</script>

<svelte:document onkeydown={onKeyDown} onkeyup={onKeyUp} />

<UserPageLayout title={data.meta.title} scrollbar={true}>
  <div
    class="sticky -top-2 z-10 bg-immich-bg dark:bg-immich-dark-bg flex-row items-center justify-between flex-wrap border-b"
  >
    <div class="flex flex-wrap gap-2 items-center justify-between">
      <DatePicker
        onDateChange={handleDateChange}
        onClearFilters={handleClearFilters}
        defaultDate={partialDate || undefined}
      />
      <div class="flex gap-2 items-center pr-8">
        <div class="flex-row gap-2 w-40">
          <label for="assets-count" class="immich-form-label">
            {$t('assets_to_display')}
          </label>
          <NumberRangeInput
            min={0}
            max={1000}
            id="assets-count"
            onInput={handleAssetsToDisplayInput}
            value={assetsToDisplay}
            step={20}
          />
        </div>
        <div class="w-8 pt-6">
          {#if isLoading}
            <LoadingSpinner size="large" />
          {/if}
        </div>
      </div>
      <div class="flex gap-2 w-80">
        <CoordinatesInput
          lat={location?.latitude}
          lng={location?.longitude}
          onUpdate={(lat, lng) => {
            location = { latitude: lat, longitude: lng };
          }}
        />
      </div>
      <div class="flex gap-2 pt-6">
        <Button
          leadingIcon={mdiMapMarkerRadius}
          size="medium"
          color="primary"
          variant="ghost"
          disabled={assetInteraction.selectedAssets.length === 0}
          onclick={() =>
            modalManager.show(GeolocationUpdateConfirmationModal, {
              location: location ?? { latitude: 0, longitude: 0 },
              assetCount: assetInteraction.selectedAssets.length,
              onUpdateLocation,
            })}
        >
          {$t('update_location')}
        </Button>
        <Button
          leadingIcon={assetInteraction.selectionActive ? mdiSelectRemove : mdiSelectAll}
          size="medium"
          color="secondary"
          variant="ghost"
          onclick={assetInteraction.selectionActive ? handleDeselectAll : handleSelectAll}
        >
          {assetInteraction.selectionActive ? $t('unselect_all') : $t('select_all')}
        </Button>
        <IconButton
          shape="round"
          variant="ghost"
          color="secondary"
          icon={mdiInformationOutline}
          aria-label={$t('deduplication_info')}
          size="small"
          onclick={() => modalManager.show(GeolocationInformationModal)}
        />
      </div>
    </div>
    <p class="text-sm text-gray-500">
      {$t('geolocation_assets_displayed', {
        values: { displayed: assetsStats.displayed, total: assetsStats.total },
      })}
    </p>
  </div>

  <div class="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
    {#if assets && assets.length > 0}
      {#each assets as asset (asset.id)}
        <Geolocation
          {asset}
          {assetInteraction}
          onSelectAsset={(asset) => handleSelectAssets(asset)}
          onMouseEvent={(asset) => assetMouseEventHandler(asset)}
          onLocationClick={(location) => onLocationClick(location)}
        />
      {/each}
    {:else}
      <p class="text-center text-lg dark:text-white flex place-items-center place-content-center">
        {$t('no_assets_to_show')}
      </p>
    {/if}
  </div>
</UserPageLayout>
