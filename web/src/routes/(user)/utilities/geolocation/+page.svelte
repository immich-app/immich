<script lang="ts">
  import { isDefined } from '#lib';
  import UserPageLayout from '#lib/components/layouts/UserPageLayout.svelte';
  import EmptyPlaceholder from '#lib/components/shared-components/EmptyPlaceholder.svelte';
  import Timeline from '#lib/components/timeline/Timeline.svelte';
  import { assetMultiSelectManager } from '#lib/managers/asset-multi-select-manager.svelte.ts';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import type { TimelineDay } from '#lib/managers/timeline-manager/timeline-day.svelte.ts';
  import { TimelineManager } from '#lib/managers/timeline-manager/timeline-manager.svelte.ts';
  import type { TimelineAsset } from '#lib/managers/timeline-manager/types.ts';
  import GeolocationHelpModal from '#lib/modals/GeolocationHelpModal.svelte';
  import GeolocationPointPickerModal from '#lib/modals/GeolocationPointPickerModal.svelte';
  import GeolocationUpdateConfirmModal from '#lib/modals/GeolocationUpdateConfirmModal.svelte';
  import { updateAssetsMutation } from '#lib/queries/asset.query.ts';
  import { executeMutation } from '#lib/queries/client.ts';
  import { keyboardManager } from '#lib/stores/keyboard-manager.svelte.ts';
  import type { LatLng } from '#lib/types.ts';
  import { setQueryValue } from '#lib/utils/navigation.ts';
  import { toTimelineAsset } from '#lib/utils/timeline-util.ts';
  import { AssetVisibility, getAssetInfo, reverseGeocode } from '@immich/sdk';
  import { Button, IconButton, LoadingSpinner, Text, modalManager } from '@immich/ui';
  import { mdiInformationOutline, mdiMapMarkerMultipleOutline, mdiPencilOutline, mdiSelectRemove } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();

  let isLoading = $state(false);
  let point = $state.raw<LatLng>();
  let locationUpdated = $state(false);
  let selectedPlace = $state.raw<Place>();

  let timelineManager = $state<TimelineManager>() as TimelineManager;
  let showOnlyWithoutGps = $state(true);
  const options = $derived({
    visibility: AssetVisibility.Timeline,
    withStacked: true,
    withPartners: true,
    withCoordinates: true,
    hasCoordinates: showOnlyWithoutGps ? false : undefined,
  });

  type Place = { city?: string | null; country?: string | null };

  const formatPlace = ({ city, country }: Place) => [city, country].filter(Boolean).join(', ');
  const formatPoint = ({ lat, lng }: LatLng) => `${lat.toFixed(3)}, ${lng.toFixed(3)}`;

  const selectedPlaceName = $derived(selectedPlace ? formatPlace(selectedPlace) : '');

  const isOwnAsset = (asset: TimelineAsset) => asset.ownerId === authManager.user.id;

  const handleUpdate = async () => {
    if (!point) {
      return;
    }

    const confirmed = await modalManager.show(GeolocationUpdateConfirmModal, {
      point,
      assetCount: assetMultiSelectManager.assets.length,
    });

    if (!confirmed) {
      return;
    }

    await executeMutation(
      () => updateAssetsMutation({ error: { toast: 'errors.unable_to_change_location' } }),
      [
        {
          assetBulkUpdateDto: {
            ids: assetMultiSelectManager.assets.filter((asset) => isOwnAsset(asset)).map((asset) => asset.id),
            latitude: point.lat,
            longitude: point.lng,
          },
        },
      ],
      { onSuccess: () => void refreshUpdatedAssets() },
    );
  };

  const refreshUpdatedAssets = async () => {
    const updatedAssets = await Promise.all(
      assetMultiSelectManager.assets.map(async (asset) => {
        const updatedAsset = await getAssetInfo({ ...authManager.params, id: asset.id });
        return toTimelineAsset(updatedAsset);
      }),
    );

    timelineManager.upsertAssets(updatedAssets);
    assetMultiSelectManager.clear();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Shift') {
      event.preventDefault();
    }
    if (event.key === 'Escape' && assetMultiSelectManager.selectionActive) {
      assetMultiSelectManager.clear();
    }
  };
  const onKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'Shift') {
      event.preventDefault();
    }
  };

  const handlePickPoint = async () => {
    const selected = await modalManager.show(GeolocationPointPickerModal, { point });
    if (!selected) {
      return;
    }

    point = selected;
    selectedPlace = undefined;
    const [place] = await reverseGeocode({ lat: selected.lat, lon: selected.lng }).catch(() => []);
    if (point === selected) {
      selectedPlace = place;
    }
  };
  const handleEscape = () => {
    if (!assetMultiSelectManager.selectionActive) {
      return;
    }

    assetMultiSelectManager.clear();
    return;
  };

  type AssetPoint = { latitude: number; longitude: number };

  const hasGps = (asset: TimelineAsset | AssetPoint): asset is AssetPoint =>
    isDefined(asset.latitude) && isDefined(asset.longitude);

  const handleThumbnailClick = (
    asset: TimelineAsset,
    timelineManager: TimelineManager,
    timelineDay: TimelineDay,
    onClick: (
      timelineManager: TimelineManager,
      assets: TimelineAsset[],
      groupTitle: string,
      asset: TimelineAsset,
    ) => void,
  ) => {
    if (keyboardManager.shift) {
      onClick(timelineManager, timelineDay.getAssets(), timelineDay.groupTitle, asset);
    } else if (hasGps(asset)) {
      locationUpdated = true;
      setTimeout(() => {
        locationUpdated = false;
      }, 1500);
      point = { lat: asset.latitude, lng: asset.longitude };
      selectedPlace = asset;
      void setQueryValue('at', asset.id);
    } else if (isOwnAsset(asset)) {
      onClick(timelineManager, timelineDay.getAssets(), timelineDay.groupTitle, asset);
    }
  };
</script>

<svelte:document onkeydown={onKeyDown} onkeyup={onKeyUp} />

<UserPageLayout title={data.meta.title} scrollbar={true}>
  {#snippet buttons()}
    <div class="flex place-items-center justify-end gap-2">
      <div class="flex overflow-hidden rounded-full bg-gray-200 p-1 text-sm font-medium dark:bg-gray-700">
        <Button
          size="small"
          shape="round"
          variant={showOnlyWithoutGps ? 'ghost' : 'filled'}
          color={showOnlyWithoutGps ? 'secondary' : 'primary'}
          onclick={() => (showOnlyWithoutGps = false)}
        >
          {$t('all')}
        </Button>
        <Button
          size="small"
          shape="round"
          variant={showOnlyWithoutGps ? 'filled' : 'ghost'}
          color={showOnlyWithoutGps ? 'primary' : 'secondary'}
          onclick={() => (showOnlyWithoutGps = true)}
        >
          {$t('no_gps')}
        </Button>
      </div>
      <div class="flex place-content-center place-items-center rounded-2xl border bg-primary/10 px-2 py-1">
        <Text class="mr-5 ml-2 hidden font-mono md:inline-block" color="muted" size="tiny">
          {$t('selected_gps_location')}
        </Text>
        <Text
          title={selectedPlaceName && point ? formatPoint(point) : $t('latitude_longitude')}
          class="rounded-3xl px-2 py-1 font-mono text-sm text-primary transition-all duration-100 ease-in-out {locationUpdated
            ? 'scale-105 bg-primary/90 font-semibold text-light'
            : ''}"
        >
          {#if point}
            {selectedPlaceName || formatPoint(point)}
          {:else}
            {$t('none')}
          {/if}
        </Text>
      </div>

      <Button size="small" color="secondary" variant="ghost" leadingIcon={mdiPencilOutline} onclick={handlePickPoint}>
        <Text class="hidden sm:inline-block">{$t('location_picker_choose_on_map')}</Text>
      </Button>
      <Button
        leadingIcon={mdiSelectRemove}
        size="small"
        color="secondary"
        variant="ghost"
        disabled={!assetMultiSelectManager.selectionActive}
        onclick={() => assetMultiSelectManager.clear()}
      >
        {$t('unselect_all')}
      </Button>
      <Button
        leadingIcon={mdiMapMarkerMultipleOutline}
        size="small"
        color="primary"
        disabled={assetMultiSelectManager.assets.length === 0}
        onclick={() => handleUpdate()}
      >
        <Text class="hidden sm:inline-block">
          {$t('apply_count', { values: { count: assetMultiSelectManager.assets.length } })}
        </Text>
      </Button>
      <IconButton
        shape="round"
        color="secondary"
        variant="ghost"
        size="small"
        icon={mdiInformationOutline}
        aria-label={$t('about')}
        onclick={() => modalManager.show(GeolocationHelpModal)}
      />
    </div>
  {/snippet}

  {#if isLoading}
    <div class="flex size-full items-center justify-center">
      <LoadingSpinner size="giant" />
    </div>
  {/if}

  <Timeline
    isSelectionMode={true}
    enableRouting={true}
    bind:timelineManager
    {options}
    assetInteraction={assetMultiSelectManager}
    onEscape={handleEscape}
    withStacked
    onThumbnailClick={handleThumbnailClick}
  >
    {#snippet customThumbnailLayout(asset: TimelineAsset)}
      {#if !isOwnAsset(asset)}
        <div class="pointer-events-none absolute inset-0 rounded-sm bg-black/40"></div>
      {/if}
      {#if hasGps(asset)}
        <div class="absolute inset-e-3 bottom-1 rounded-xl bg-success px-4 py-1 text-xs text-black transition-colors">
          {formatPlace(asset) || $t('gps')}
        </div>
      {:else}
        <div class="absolute inset-e-3 bottom-1 rounded-xl bg-danger px-4 py-1 text-xs text-light transition-colors">
          {$t('gps_missing')}
        </div>
      {/if}
    {/snippet}
    {#snippet empty()}
      <EmptyPlaceholder text={$t('no_assets_message')} onClick={() => {}} class="mx-auto mt-10" />
    {/snippet}
  </Timeline>
</UserPageLayout>
