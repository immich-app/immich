<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { getAssetResolution, getFileSize } from '$lib/utils/asset-utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { fromISODateTime, fromISODateTimeUTC, toTimelineAsset } from '$lib/utils/timeline-util';
  import { type AssetResponseDto, getAllAlbums } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import {
    mdiBookmarkOutline,
    mdiCalendar,
    mdiHeart,
    mdiImageMultipleOutline,
    mdiImageOutline,
    mdiMagnifyPlus,
    mdiMapMarkerOutline,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    isSelected: boolean;
    onSelectAsset: (asset: AssetResponseDto) => void;
    onViewAsset: (asset: AssetResponseDto) => void;
  }

  let { asset, isSelected, onSelectAsset, onViewAsset }: Props = $props();

  let isFromExternalLibrary = $derived(!!asset.libraryId);
  let assetData = $derived(JSON.stringify(asset, null, 2));

  let locationParts = $derived([asset.exifInfo?.city, asset.exifInfo?.state, asset.exifInfo?.country].filter(Boolean));

  let timeZone = $derived(asset.exifInfo?.timeZone);
  let dateTime = $derived(
    timeZone && asset.exifInfo?.dateTimeOriginal
      ? fromISODateTime(asset.exifInfo.dateTimeOriginal, timeZone)
      : fromISODateTimeUTC(asset.localDateTime),
  );
</script>

<div
  class="max-w-60 rounded-xl border-4 transition-colors font-semibold text-xs {isSelected
    ? 'bg-primary border-primary'
    : 'bg-subtle border-subtle'}"
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
        alt={$getAltText(toTimelineAsset(asset))}
        title={assetData}
        class="h-60 object-cover rounded-t-xl w-full"
        draggable="false"
      />

      <!-- FAVORITE ICON -->
      {#if asset.isFavorite}
        <div class="absolute bottom-2 start-2">
          <Icon icon={mdiHeart} size="24" class="text-white" />
        </div>
      {/if}

      <!-- OVERLAY CHIP -->
      <div
        class="absolute bottom-1 end-3 px-4 py-1 rounded-xl text-xs transition-colors {isSelected
          ? 'bg-green-400/90'
          : 'bg-red-300/90'} text-black"
      >
        {isSelected ? $t('keep') : $t('to_trash')}
      </div>

      <!-- EXTERNAL LIBRARY / STACK COUNT CHIP -->
      <div class="absolute top-2 end-3">
        {#if isFromExternalLibrary}
          <div class="bg-immich-primary/90 px-2 py-1 rounded-xl text-xs text-white">
            {$t('external')}
          </div>
        {/if}
        {#if asset.stack?.assetCount}
          <div class="bg-immich-primary/90 px-2 py-1 my-0.5 rounded-xl text-xs text-white">
            <div class="flex items-center justify-center">
              <div class="me-1">{asset.stack.assetCount}</div>
              <Icon icon={mdiImageMultipleOutline} size="18" />
            </div>
          </div>
        {/if}
      </div>
    </button>

    <button
      type="button"
      onclick={() => onViewAsset(asset)}
      class="absolute rounded-full top-1 start-1 text-gray-200 p-2 hover:text-white bg-black/35 hover:bg-black/50"
      title={$t('view')}
    >
      <Icon aria-label={$t('view')} icon={mdiMagnifyPlus} flipped size="18" />
    </button>
  </div>

  <div
    class="grid place-items-start gap-y-2 py-2 text-xs transition-colors {isSelected
      ? 'text-white dark:text-black'
      : 'dark:text-white'}"
  >
    <div class="flex items-start gap-x-1">
      <Icon icon={mdiImageOutline} size="16" />
      <div>
        <span class="break-all text-center">{asset.originalFileName}</span><br />
        {getAssetResolution(asset)} - {getFileSize(asset)}
      </div>
    </div>
    <div class="flex items-start gap-x-1">
      <Icon icon={mdiCalendar} size="16" />
      {#if dateTime}
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
            // weekday: 'short',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: timeZone ? 'shortOffset' : undefined,
          },
          { locale: $locale },
        )}
      {:else}
        {$t('unknown')}
      {/if}
    </div>

    <div class="flex items-start gap-x-1">
      <Icon icon={mdiMapMarkerOutline} size="16" />
      {#if locationParts.length > 0}
        {locationParts.join(', ')}
      {:else}
        {$t('unknown')}
      {/if}
    </div>
    <div class="flex items-start gap-x-1">
      <Icon icon={mdiBookmarkOutline} size="16" />
      {#await getAllAlbums({ assetId: asset.id })}
        {$t('scanning_for_album')}
      {:then albums}
        {#if albums.length === 0}
          {$t('not_in_any_album')}
        {:else}
          {$t('in_albums', { values: { count: albums.length } })}
        {/if}
      {/await}
    </div>
  </div>
</div>
