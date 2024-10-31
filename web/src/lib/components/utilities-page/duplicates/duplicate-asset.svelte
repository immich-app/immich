<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { getAssetResolution, getFileSize } from '$lib/utils/asset-utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { getAllAlbums, type AssetResponseDto } from '@immich/sdk';
  import { mdiHeart, mdiMagnifyPlus, mdiImageMultipleOutline, mdiArchiveArrowDownOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    isSelected: boolean;
    onSelectAsset: (asset: AssetResponseDto) => void;
    onViewAsset: (asset: AssetResponseDto) => void;
  }
  export let selectedSyncData;
  export let onSelectDate: (dateTime) => void;
  export let onSelectDescription: (description) => void;
  export let onSelectLocation: (location) => void;

  let { asset, isSelected, onSelectAsset, onViewAsset }: Props = $props();

  let isFromExternalLibrary = $derived(!!asset.libraryId);
  let assetData = $derived(JSON.stringify(asset, null, 2));

  $: timeZone = asset.exifInfo?.timeZone;
  $: dateTime =
    timeZone && asset.exifInfo?.dateTimeOriginal
      ? fromDateTimeOriginal(asset.exifInfo.dateTimeOriginal, timeZone)
      : fromLocalDateTime(asset.localDateTime);
  $: description = asset.exifInfo?.description;
  $: location = { latitude: asset.exifInfo?.latitude, longitude: asset.exifInfo?.longitude };
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
        {#if asset.isFavorite}
          <Icon path={mdiHeart} size="24" class="text-white inline-block" />
        {/if}
        {#if asset.isArchived}
          <Icon path={mdiArchiveArrowDownOutline} size="24" class="text-white inline-block" />
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
    <span>
      {#await getAllAlbums({ assetId: asset.id })}
        {$t('scanning_for_album')}
      {:then albums}
        {#if albums.length === 0}
          {$t('not_in_any_album')}
        {:else}
          {$t('in_albums', { values: { count: albums.length } })}
        {/if}
      {/await}
    </span>
    <button
      type="button"
      class="dark:hover:bg-gray-300 {isSelected
        ? 'hover:bg-gray-300'
        : 'hover:bg-gray-500'} {selectedSyncData.dateTime === null
        ? ''
        : selectedSyncData.dateTime?.ts === dateTime?.ts
          ? 'bg-green-400/90'
          : 'bg-red-300/90'}"
      on:click={() => onSelectDate(dateTime)}
    >
      {dateTime.toLocaleString(
        {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        },
        { locale: $locale },
      )}
      {dateTime.toLocaleString(
        {
          weekday: 'short',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: timeZone ? 'longOffset' : undefined,
        },
        { locale: $locale },
      )}
    </button>
    <button
      type="button"
      id="description_button"
      class="dark:hover:bg-gray-300 {isSelected
        ? 'hover:bg-gray-300'
        : 'hover:bg-gray-500'} {selectedSyncData.description === null
        ? ''
        : selectedSyncData.description === description
          ? 'bg-green-400/90'
          : 'bg-red-300/90'}"
      on:click={() => onSelectDescription(description)}
    >
      {description}
    </button>
    <button
      type="button"
      id="location_button"
      class="dark:hover:bg-gray-300 {isSelected
        ? 'hover:bg-gray-300'
        : 'hover:bg-gray-500'} {selectedSyncData.location === null
        ? ''
        : selectedSyncData.location.latitude === location.latitude &&
            selectedSyncData.location.longitude === location.longitude
          ? 'bg-green-400/90'
          : 'bg-red-300/90'}"
      on:click={() => onSelectLocation(location)}
    >
      <DetailPanelLocation isOwner={false} {asset} />
    </button>
  </div>
</div>
