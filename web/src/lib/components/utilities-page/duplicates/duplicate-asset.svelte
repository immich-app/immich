<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { getAssetResolution, getFileSize } from '$lib/utils/asset-utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { getAllAlbums, type AssetResponseDto } from '@immich/sdk';
  import { mdiHeart, mdiMagnifyPlus, mdiImageMultipleOutline, mdiArchiveArrowDownOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { fromDateTimeOriginal, fromLocalDateTime } from '$lib/utils/timeline-util';
  import { locale } from '$lib/stores/preferences.store';

  interface Props {
    asset: AssetResponseDto;
    isSelected: boolean;
    onSelectAsset: (asset: AssetResponseDto) => void;
    onViewAsset: (asset: AssetResponseDto) => void;
  }
  let { asset, isSelected, onSelectAsset, onViewAsset }: Props = $props();

  let isFromExternalLibrary = $derived(!!asset.libraryId);
  let assetData = $derived(JSON.stringify(asset, null, 2));

  export let selectedSyncData;
  export let onSelectDate: (dateTime) => void;
  export let onSelectDescription: (description) => void;
  export let onSelectLocation: (location) => void;
  export let descriptionHeight;
  export let setDescriptionHeight: (height) => void;
  export let locationHeight;
  export let setLocationHeight: (height) => void;
  export let isSynchronizeAlbumsActive: boolean;
  export let isSynchronizeFavoritesActive: boolean;
  export let isSynchronizeArchivesActive: boolean;
  export let setAlbums: (albums) => void;

  selectedSyncData.isFavorite = selectedSyncData.isFavorite || asset.isFavorite;
  selectedSyncData.isArchived = selectedSyncData.isArchived || asset.isArchived;

  let descriptionItem;
  let locationItem;
  let albums = [];
  onMount(async () => {
    setDescriptionHeight(descriptionItem.getBoundingClientRect().height);
    setLocationHeight(locationItem.getBoundingClientRect().height);
    albums = await getAllAlbums({ assetId: asset.id });
    setAlbums(albums);
  });

  const getBackgroundColor = (isSelected, syncDataExist, syncIsAssetData) => {
    let color = 'rounded-xl dark:hover:bg-gray-300';
    color += isSelected ? ' hover:bg-gray-300' : ' hover:bg-gray-500';
    if (isSelected) {
      if (syncDataExist && !syncIsAssetData) {
        color += ' bg-red-300/90';
      }
    } else {
      if (syncIsAssetData) {
        color += ' bg-green-400/90';
      }
    }
    return color;
  };

  $: timeZone = asset.exifInfo?.timeZone;
  $: dateTime =
    timeZone && asset.exifInfo?.dateTimeOriginal
      ? fromDateTimeOriginal(asset.exifInfo.dateTimeOriginal, timeZone)
      : fromLocalDateTime(asset.localDateTime);
  $: description = asset.exifInfo?.description;
  $: location = {
    latitude: asset.exifInfo?.latitude,
    longitude: asset.exifInfo?.longitude,
    city: asset.exifInfo?.city,
    state: asset.exifInfo?.state,
    country: asset.exifInfo?.country,
  };
  $: displayedDateTime = isSelected && selectedSyncData?.dateTime ? selectedSyncData.dateTime : dateTime;
  $: displayedTimeZone = isSelected && selectedSyncData?.timeZone ? selectedSyncData.timeZone : timeZone;
  $: displayedLocation = isSelected && selectedSyncData?.location ? selectedSyncData.location : location;
  $: displayedDescription = isSelected && selectedSyncData?.description ? selectedSyncData.description : description;
  $: displayedFavorite =
    isSelected && isSynchronizeFavoritesActive && selectedSyncData?.isFavorite
      ? selectedSyncData.isFavorite
      : asset.isFavorite;
  $: displayedArchived =
    isSelected && isSynchronizeArchivesActive && selectedSyncData?.isArchived
      ? selectedSyncData.isArchived
      : asset.isArchived;
  $: displayedAlbums =
    isSelected && isSynchronizeAlbumsActive && selectedSyncData?.albums ? selectedSyncData.albums : albums;
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
    <button
      type="button"
      style="padding: 3px;"
      class={getBackgroundColor(isSelected, selectedSyncData?.dateTime, selectedSyncData.dateTime?.ts === dateTime?.ts)}
      on:click={() => onSelectDate(displayedDateTime)}
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
    </button>
    <button
      type="button"
      bind:this={locationItem}
      style="padding: 3px; {locationHeight ? 'height: ' + locationHeight + 'px' : ''}"
      class={getBackgroundColor(
        isSelected,
        selectedSyncData?.location,
        selectedSyncData?.location?.latitude === location.latitude &&
          selectedSyncData?.location?.longitude === location.longitude,
      )}
      on:click={() => onSelectLocation(displayedLocation)}
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
    </button>
    <button
      type="button"
      bind:this={descriptionItem}
      style="padding: 3px; {descriptionHeight ? 'height: ' + descriptionHeight + 'px' : ''}"
      class={getBackgroundColor(
        isSelected,
        selectedSyncData?.description,
        selectedSyncData?.description === description,
      )}
      on:click={() => onSelectDescription(displayedDescription)}
    >
      {displayedDescription}
    </button>
  </div>
</div>
