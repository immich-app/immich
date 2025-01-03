<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { getAssetResolution, getFileSize } from '$lib/utils/asset-utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { getAllAlbums, type AssetResponseDto, type AlbumResponseDto } from '@immich/sdk';
  import { mdiHeart, mdiMagnifyPlus, mdiImageMultipleOutline, mdiArchiveArrowDownOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { fromDateTimeOriginal, fromLocalDateTime } from '$lib/utils/timeline-util';
  import { locale } from '$lib/stores/preferences.store';
  import type { SelectedSyncData } from '$lib/components/utilities-page/duplicates/duplicates-compare-control.svelte';
  import { DateTime } from 'luxon';
  import DuplicateAssetSelection from '$lib/components/utilities-page/duplicates/duplicate-asset-selection.svelte';

  interface Props {
    asset: AssetResponseDto;
    descriptionHeight: number;
    isSelected: boolean;
    isSynchronizeAlbumsActive: boolean;
    isSynchronizeFavoritesActive: boolean;
    isSynchronizeArchivesActive: boolean;
    locationHeight: number;
    selectedSyncData: SelectedSyncData;
    onSelectAsset: (asset: AssetResponseDto) => void;
    onViewAsset: (asset: AssetResponseDto) => void;
    onSelectDate: (dateTime: DateTime) => void;
    onSelectDescription: (description: string) => void;
    onSelectLocation: (location: SelectedSyncData['location']) => void;
    setAlbums: (albums: AlbumResponseDto[]) => void;
    setDescriptionHeight: (height: number) => void;
    setLocationHeight: (height: number) => void;
  }

  let {
    asset,
    descriptionHeight,
    isSelected,
    isSynchronizeAlbumsActive,
    isSynchronizeFavoritesActive,
    isSynchronizeArchivesActive,
    locationHeight,
    selectedSyncData,
    onSelectAsset,
    onViewAsset,
    onSelectDate,
    onSelectDescription,
    onSelectLocation,
    setAlbums,
    setDescriptionHeight,
    setLocationHeight,
  }: Props = $props();

  let isFromExternalLibrary = $derived(!!asset.libraryId);
  let assetData = $derived(JSON.stringify(asset, null, 2));

  selectedSyncData.isFavorite = selectedSyncData.isFavorite || asset.isFavorite;
  selectedSyncData.isArchived = selectedSyncData.isArchived || asset.isArchived;

  let descriptionItem = $state<DuplicateAssetSelection>();
  let locationItem = $state<DuplicateAssetSelection>();
  let albums: AlbumResponseDto[] = $state([]);
  onMount(async () => {
    setDescriptionHeight(descriptionItem.getHeight());
    setLocationHeight(locationItem.getHeight());
    albums = await getAllAlbums({ assetId: asset.id });
    setAlbums(albums);
  });

  let timeZone = $derived(asset.exifInfo?.timeZone);
  let dateTime = $derived(
    timeZone && asset.exifInfo?.dateTimeOriginal
      ? fromDateTimeOriginal(asset.exifInfo.dateTimeOriginal, timeZone)
      : fromLocalDateTime(asset.localDateTime),
  );
  let description = $derived(asset.exifInfo?.description);
  let location = $derived({
    latitude: asset.exifInfo?.latitude,
    longitude: asset.exifInfo?.longitude,
    city: asset.exifInfo?.city,
    state: asset.exifInfo?.state,
    country: asset.exifInfo?.country,
  });
  let displayedDateTime = $derived(isSelected && selectedSyncData?.dateTime ? selectedSyncData.dateTime : dateTime);
  let displayedTimeZone = $derived(isSelected && selectedSyncData?.timeZone ? selectedSyncData.timeZone : timeZone);
  let displayedLocation = $derived(isSelected && selectedSyncData?.location ? selectedSyncData.location : location);
  let displayedDescription = $derived(
    isSelected && selectedSyncData?.description ? selectedSyncData.description : description,
  );
  let displayedFavorite = $derived(
    isSelected && isSynchronizeFavoritesActive && selectedSyncData?.isFavorite
      ? selectedSyncData.isFavorite
      : asset.isFavorite,
  );
  let displayedArchived = $derived(
    isSelected && isSynchronizeArchivesActive && selectedSyncData?.isArchived
      ? selectedSyncData.isArchived
      : asset.isArchived,
  );
  let displayedAlbums = $derived(
    isSelected && isSynchronizeAlbumsActive && selectedSyncData?.albums ? selectedSyncData.albums : albums,
  );
</script>

<div
  class="max-w-60 rounded-xl border-4 transition-colors font-semibold text-xs {isSelected
    ? 'bg-immich-primary dark:bg-immich-dark-primary border-immich-primary dark:border-immich-dark-primary'
    : 'bg-gray-200 dark:bg-gray-800 border-gray-200 dark:border-gray-800'}"
>
  <div class="relative w-full">
    <button
      type="button"
      onclick={() => onSelectAsset(asset)}
      class="block relative w-full"
      aria-pressed={isSelected}
      aria-label={$t('keep')}
    >
      <!-- THUMBNAIL-->
      <img
        src={getAssetThumbnailUrl(asset.id)}
        alt={$getAltText(asset)}
        title={assetData}
        class="h-60 object-cover rounded-t-xl w-full"
        draggable="false"
      />

      <!-- FAVORITE ICON -->
      <div class="absolute bottom-2 left-2">
        {#if displayedFavorite}
          {#if asset.isFavorite}
            <Icon path={mdiHeart} size="24" class="text-white inline-block" />
          {:else}
            <Icon path={mdiHeart} size="24" color="red" class="text-white inline-block" />
          {/if}
        {/if}
        {#if displayedArchived}
          {#if asset.isArchived}
            <Icon path={mdiArchiveArrowDownOutline} size="24" class="text-white inline-block" />
          {:else}
            <Icon path={mdiArchiveArrowDownOutline} size="24" color="red" class="text-white inline-block" />
          {/if}
        {/if}
      </div>

      <!-- OVERLAY CHIP -->
      <div
        class="absolute bottom-1 right-3 px-4 py-1 rounded-xl text-xs transition-colors {isSelected
          ? 'bg-green-400/90'
          : 'bg-red-300/90'}"
      >
        {isSelected ? $t('keep') : $t('to_trash')}
      </div>

      <!-- EXTERNAL LIBRARY / STACK COUNT CHIP -->
      <div class="absolute top-2 right-3">
        {#if isFromExternalLibrary}
          <div class="bg-immich-primary/90 px-2 py-1 rounded-xl text-xs text-white">
            {$t('external')}
          </div>
        {/if}
        {#if asset.stack?.assetCount}
          <div class="bg-immich-primary/90 px-2 py-1 my-0.5 rounded-xl text-xs text-white">
            <div class="flex items-center justify-center">
              <div class="mr-1">{asset.stack.assetCount}</div>
              <Icon path={mdiImageMultipleOutline} size="18" />
            </div>
          </div>
        {/if}
      </div>
    </button>

    <button
      type="button"
      onclick={() => onViewAsset(asset)}
      class="absolute rounded-full top-1 left-1 text-gray-200 p-2 hover:text-white bg-black/35 hover:bg-black/50"
      title={$t('view')}
    >
      <Icon ariaLabel={$t('view')} path={mdiMagnifyPlus} flipped size="18" />
    </button>
  </div>

  <div
    class="grid place-items-center gap-y-2 py-2 text-xs transition-colors {isSelected
      ? 'text-white dark:text-black'
      : 'dark:text-white'}"
  >
    <span class="break-all text-center">{asset.originalFileName}</span>
    <span>{getAssetResolution(asset)} - {getFileSize(asset)}</span>
    <span
      style="padding: 3px;"
      class="rounded-xl {isSelected &&
      isSynchronizeAlbumsActive &&
      displayedAlbums.length > 0 &&
      selectedSyncData.albums !== albums
        ? 'bg-red-300/90'
        : ''}"
    >
      {#if !albums}
        {$t('scanning_for_album')}
      {:else if displayedAlbums.length === 0}
        {$t('not_in_any_album')}
      {:else}
        {$t('in_albums', { values: { count: displayedAlbums.length } })}
      {/if}
    </span>
    <DuplicateAssetSelection
      {isSelected}
      selectedData={selectedSyncData.dateTime}
      displayedData={displayedDateTime}
      isSelectedEqualOriginal={selectedSyncData.dateTime?.ts === dateTime?.ts}
      onClick={() => onSelectDate(displayedDateTime)}
    >
      {displayedDateTime.toLocaleString(
        {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        },
        { locale: $locale },
      )}
      {displayedDateTime.toLocaleString(
        {
          weekday: 'short',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: displayedTimeZone ? 'longOffset' : undefined,
        },
        { locale: $locale },
      )}
    </DuplicateAssetSelection>
    <DuplicateAssetSelection
      bind:this={locationItem}
      {isSelected}
      slotHeight={locationHeight}
      selectedData={selectedSyncData?.location}
      displayedData={displayedLocation?.city && displayedLocation?.state && displayedLocation?.country}
      isSelectedEqualOriginal={selectedSyncData?.location?.latitude === location.latitude &&
        selectedSyncData?.location?.longitude === location.longitude}
      onClick={() => onSelectLocation(displayedLocation)}
    >
      {#if displayedLocation?.city}
        <div class="text-sm">
          <p>{displayedLocation.city}</p>
        </div>
      {/if}
      {#if displayedLocation?.state}
        <p>{displayedLocation.state}</p>
      {/if}
      {#if displayedLocation?.country}
        <p>{displayedLocation.country}</p>
      {/if}
    </DuplicateAssetSelection>
    <DuplicateAssetSelection
      bind:this={descriptionItem}
      {isSelected}
      slotHeight={descriptionHeight}
      selectedData={selectedSyncData.description}
      displayedData={displayedDescription}
      isSelectedEqualOriginal={selectedSyncData?.description === description}
      onClick={() => onSelectDescription(displayedDescription)}
    >
      {displayedDescription}
    </DuplicateAssetSelection>
  </div>
</div>
