<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
  import ChangeLocation from '$lib/components/shared-components/change-location.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import { AssetAction } from '$lib/constants';
  import type { DayGroup } from '$lib/managers/timeline-manager/day-group.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import GeolocationUpdateConfirmModal from '$lib/modals/GeolocationUpdateConfirmModal.svelte';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { cancelMultiselect } from '$lib/utils/asset-utils';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { AssetVisibility, updateAssets, type AssetResponseDto } from '@immich/sdk';
  import { Button, LoadingSpinner, modalManager, Text } from '@immich/ui';
  import { mdiMapMarkerMultipleOutline, mdiPencilOutline, mdiSelectRemove } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let isLoading = $state(false);
  let assets = $state<AssetResponseDto[]>([]);
  let assetInteraction = new AssetInteraction();
  let location = $state<{ latitude: number; longitude: number }>({ latitude: 0, longitude: 0 });
  const timelineManager = new TimelineManager();
  void timelineManager.updateOptions({ visibility: AssetVisibility.Timeline, withStacked: true, withPartners: true });

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

    handleDeselectAll();
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
  const handleEscape = () => {
    // if ($showAssetViewer) {
    //   return;
    // }
    if (assetInteraction.selectionActive) {
      assetInteraction.clearMultiselect();
      return;
    }
  };

  const hasGps = (asset: TimelineAsset) => !!asset.city && !!asset.country;

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
    if (hasGps(asset)) {
      console.log('has gps', asset);
      // set location from asset
      // Need TimelineAsset to load locations from buckets
    } else {
      console.log('no gps', asset);
      onClick(timelineManager, dayGroup.getAssets(), dayGroup.groupTitle, asset);
    }
  };
</script>

<svelte:document onkeydown={onKeyDown} onkeyup={onKeyUp} />

<UserPageLayout title={data.meta.title} scrollbar={true}>
  {#snippet buttons()}
    <div class="flex gap-2 justify-end place-items-center">
      <Text>{location.latitude.toFixed(3)},{location.longitude.toFixed(3)}</Text>
      <Button size="small" color="secondary" variant="ghost" leadingIcon={mdiPencilOutline} onclick={handlePickOnMap}
        >{$t('location_picker_choose_on_map')}</Button
      >
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

  {#if isLoading}
    <div class="h-full w-full flex items-center justify-center">
      <LoadingSpinner size="giant" />
    </div>
  {/if}

  {#snippet customLayout(asset: TimelineAsset)}
    {#if hasGps(asset)}
      <div class="absolute bottom-1 end-3 px-4 py-1 rounded-xl text-xs transition-colors bg-green-500">
        {$t('gps')}
      </div>
    {:else}
      <div class="absolute bottom-1 end-3 px-4 py-1 rounded-xl text-xs transition-colors bg-red-500">
        {$t('gps_missing')}
      </div>
    {/if}
  {/snippet}

  <AssetGrid
    isSelectionMode={true}
    enableRouting={true}
    {timelineManager}
    {assetInteraction}
    removeAction={AssetAction.ARCHIVE}
    onEscape={handleEscape}
    withStacked
    {customLayout}
    onThumbnailClick={handleThumbnailClick}
  >
    {#snippet empty()}
      <EmptyPlaceholder text={$t('no_assets_message')} onClick={() => {}} />
    {/snippet}
  </AssetGrid>
</UserPageLayout>
