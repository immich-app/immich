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
    mdiClock,
    mdiFile,
    mdiFitToScreen,
    mdiFolderOutline,
    mdiHeart,
    mdiImageMultipleOutline,
    mdiImageOutline,
    mdiMagnifyPlus,
    mdiMapMarkerOutline,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import InfoRow from './info-row.svelte';

  interface Props {
    assets: AssetResponseDto[];
    asset: AssetResponseDto;
    isSelected: boolean;
    onSelectAsset: (asset: AssetResponseDto) => void;
    onViewAsset: (asset: AssetResponseDto) => void;
  }

  let { assets, asset, isSelected, onSelectAsset, onViewAsset }: Props = $props();

  let isFromExternalLibrary = $derived(!!asset.libraryId);
  let assetData = $derived(JSON.stringify(asset, null, 2));

  let locationParts = $derived([asset.exifInfo?.city, asset.exifInfo?.state, asset.exifInfo?.country].filter(Boolean));

  let timeZone = $derived(asset.exifInfo?.timeZone);
  let dateTime = $derived(
    timeZone && asset.exifInfo?.dateTimeOriginal
      ? fromISODateTime(asset.exifInfo.dateTimeOriginal, timeZone)
      : fromISODateTimeUTC(asset.localDateTime),
  );

  const isDifferent = (getter: (asset: AssetResponseDto) => string | undefined): boolean => {
    return new Set(assets.map((asset) => getter(asset))).size > 1;
  };

  const hasDifferentValues = $derived({
    fileName: isDifferent((a) => a.originalFileName),
    fileSize: isDifferent((a) => getFileSize(a)),
    resolution: isDifferent((a) => getAssetResolution(a)),
    originalPath: isDifferent((a) => a.originalPath ?? $t('unknown')),
    date: isDifferent((a) => {
      const tz = a.exifInfo?.timeZone;
      const dt =
        tz && a.exifInfo?.dateTimeOriginal
          ? fromISODateTime(a.exifInfo.dateTimeOriginal, tz)
          : fromISODateTimeUTC(a.localDateTime);
      return dt?.toLocaleString({ month: 'short', day: 'numeric', year: 'numeric' }, { locale: $locale });
    }),
    time: isDifferent((a) => {
      const tz = a.exifInfo?.timeZone;
      const dt =
        tz && a.exifInfo?.dateTimeOriginal
          ? fromISODateTime(a.exifInfo.dateTimeOriginal, tz)
          : fromISODateTimeUTC(a.localDateTime);
      return dt?.toLocaleString(
        {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: tz ? 'shortOffset' : undefined,
        },
        { locale: $locale },
      );
    }),
    location: isDifferent(
      (a) => [a.exifInfo?.city, a.exifInfo?.state, a.exifInfo?.country].filter(Boolean).join(', ') || 'unknown',
    ),
  });

  const getBasePath = (fullpath: string, fileName: string): string => {
    if (fileName && fullpath.endsWith(fileName)) {
      return fullpath.slice(0, -(fileName.length + 1));
    }
    return fullpath;
  };

  function truncateMiddle(path: string, maxLength: number = 50): string {
    if (path.length <= maxLength) {
      return path;
    }

    const start = Math.floor(maxLength / 2) - 2;
    const end = Math.floor(maxLength / 2) - 2;

    return path.slice(0, Math.max(0, start)) + '...' + path.slice(Math.max(0, path.length - end));
  }
</script>

<div class="min-w-60 transition-colors border rounded-lg flex-1">
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
        class="h-60 object-cover w-full rounded-t-md"
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
    class="grid place-items-start gap-y-2 py-2 text-sm transition-colors rounded-b-lg {isSelected
      ? 'bg-success/15 dark:bg-[#001a06]'
      : 'bg-transparent'}"
  >
    <InfoRow
      icon={mdiImageOutline}
      highlight={hasDifferentValues.fileName}
      title={$t('file_name', { values: { file_name: asset.originalFileName ?? '' } })}
    >
      {asset.originalFileName}
    </InfoRow>

    <InfoRow
      icon={mdiFolderOutline}
      highlight={hasDifferentValues.originalPath}
      title={$t('full_path', { values: { path: asset.originalPath } })}
    >
      {truncateMiddle(getBasePath(asset.originalPath, asset.originalFileName)) || $t('unknown')}
    </InfoRow>

    <InfoRow icon={mdiFile} highlight={hasDifferentValues.fileSize} title={$t('file_size')}>
      {getFileSize(asset)}
    </InfoRow>

    <InfoRow icon={mdiFitToScreen} highlight={hasDifferentValues.resolution} title={$t('resolution')}>
      {getAssetResolution(asset)}
    </InfoRow>

    <InfoRow icon={mdiCalendar} highlight={hasDifferentValues.date} title={$t('date')}>
      {#if dateTime}
        {dateTime.toLocaleString(
          {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          },
          { locale: $locale },
        )}
      {:else}
        {$t('unknown')}
      {/if}
    </InfoRow>

    <InfoRow icon={mdiClock} highlight={hasDifferentValues.time} title={$t('time')}>
      {#if dateTime}
        {dateTime.toLocaleString(
          {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: timeZone ? 'shortOffset' : undefined,
          },
          { locale: $locale },
        )}
      {:else}
        {$t('unknown')}
      {/if}
    </InfoRow>

    <InfoRow icon={mdiMapMarkerOutline} highlight={hasDifferentValues.location} title={$t('location')}>
      {#if locationParts.length > 0}
        {locationParts.join(', ')}
      {:else}
        {$t('unknown')}
      {/if}
    </InfoRow>

    <InfoRow icon={mdiBookmarkOutline} borderBottom={false} title={$t('albums')}>
      {#await getAllAlbums({ assetId: asset.id })}
        {$t('scanning_for_album')}
      {:then albums}
        {$t('in_albums', { values: { count: albums.length } })}
      {/await}
    </InfoRow>
  </div>
</div>
