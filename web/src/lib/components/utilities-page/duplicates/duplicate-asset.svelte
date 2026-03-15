<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import { getAssetMediaUrl } from '$lib/utils';
  import { getAssetResolution, getFileSize } from '$lib/utils/asset-utils';
  import { MetadataFieldKeys, type DifferingMetadataFields, type MetadataFieldKey } from '$lib/utils/duplicate-utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { fromISODateTime, fromISODateTimeUTC, toTimelineAsset } from '$lib/utils/timeline-util';
  import { getAllAlbums, type AssetResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import {
    mdiAlbum,
    mdiBrightness6,
    mdiCalendar,
    mdiCamera,
    mdiCameraIris,
    mdiCameraOutline,
    mdiClockEditOutline,
    mdiCrosshairsGps,
    mdiEarth,
    mdiFileClockOutline,
    mdiFileEditOutline,
    mdiFileImageOutline,
    mdiFitToScreen,
    mdiFolderOutline,
    mdiHeart,
    mdiImageMultipleOutline,
    mdiMagnifyPlus,
    mdiMapMarkerOutline,
    mdiPanorama,
    mdiPhoneRotateLandscape,
    mdiRayStartArrow,
    mdiStarOutline,
    mdiTextBox,
    mdiTimerOutline,
    mdiWeightKilogram,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import InfoRow from './info-row.svelte';

  interface Props {
    asset: AssetResponseDto;
    isSelected: boolean;
    onSelectAsset: (asset: AssetResponseDto) => void;
    onViewAsset: (asset: AssetResponseDto) => void;
    differingMetadataFields: DifferingMetadataFields;
    showMore?: boolean;
    intialVisibleCount?: number;
  }

  let {
    asset,
    isSelected,
    onSelectAsset,
    onViewAsset,
    differingMetadataFields,
    showMore = false,
    intialVisibleCount = 5,
  }: Props = $props();

  let isFromExternalLibrary = $derived(!!asset.libraryId);
  let assetData = $derived(JSON.stringify(asset, null, 2));
  let locationParts = $derived([asset.exifInfo?.city, asset.exifInfo?.state, asset.exifInfo?.country].filter(Boolean));

  let timeZone = $derived(asset.exifInfo?.timeZone);
  let dateTime = $derived(
    timeZone && asset.exifInfo?.dateTimeOriginal
      ? fromISODateTime(asset.exifInfo.dateTimeOriginal, timeZone)
      : fromISODateTimeUTC(asset.localDateTime),
  );

  // Ordered list of keys that differ, sliced based on show-more state
  let visibleKeySet = $derived(
    new Set(
      MetadataFieldKeys.filter((k) => !!differingMetadataFields[k]).slice(0, showMore ? undefined : intialVisibleCount),
    ),
  );

  const isVisible = (key: MetadataFieldKey): boolean => visibleKeySet.has(key);

  const formatISODateToLocale = (iso: string): string => {
    return fromISODateTimeUTC(iso).toLocaleString(
      { month: 'short', day: 'numeric', year: 'numeric' },
      { locale: $locale },
    );
  };

  function truncateMiddle(path: string, maxLength: number = 50): string {
    if (path.length <= maxLength) {
      return path;
    }

    // Always preserve the last segment (filename + extension) at the end
    const lastSlash = path.lastIndexOf('/');
    const tail = lastSlash === -1 ? path : path.slice(lastSlash); // includes the leading '/'

    // If the tail alone already fills the budget, fall back to symmetric truncation
    if (tail.length >= maxLength - 3) {
      const half = Math.floor((maxLength - 3) / 2);
      return path.slice(0, half) + '...' + path.slice(-half);
    }

    const headLength = maxLength - 3 - tail.length;
    return path.slice(0, headLength) + '...' + tail;
  }

  type MetadataItem = {
    icon: string;
    title: string;
    render: string;
    keys: MetadataFieldKey[];
  };

  let allMetadataItems = $derived([
    {
      icon: mdiFileImageOutline,
      title: $t('file_name_text'),
      render: asset.originalFileName,
      keys: ['originalFileName'],
    },
    {
      icon: mdiFolderOutline,
      title: $t('path'),
      render: truncateMiddle(asset.originalPath) || $t('unknown'),
      keys: ['originalPath'],
    },
    { icon: mdiWeightKilogram, title: $t('file_size'), render: getFileSize(asset), keys: ['fileSize'] },
    {
      icon: mdiFitToScreen,
      title: $t('resolution'),
      render: getAssetResolution(asset) || $t('unknown'),
      keys: ['resolution'],
    },
    {
      icon: mdiFileClockOutline,
      title: $t('created_at'),
      render: formatISODateToLocale(asset.fileCreatedAt),
      keys: ['fileCreatedAt'],
    },
    {
      icon: mdiFileEditOutline,
      title: $t('updated_at'),
      render: formatISODateToLocale(asset.fileModifiedAt),
      keys: ['fileModifiedAt'],
    },
    {
      icon: mdiCalendar,
      title: $t('date_time_original'),
      render: dateTime
        ? dateTime.toLocaleString(
            {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
              timeZoneName: 'shortOffset',
            },
            { locale: $locale },
          )
        : $t('unknown'),
      keys: ['dateTimeOriginal'],
    },
    {
      icon: mdiEarth,
      title: $t('timezone'),
      render: dateTime?.offsetNameShort ?? $t('unknown'),
      keys: ['timeZone'],
    },
    {
      icon: mdiClockEditOutline,
      title: $t('modify_date'),
      render: asset.exifInfo?.modifyDate ? formatISODateToLocale(asset.exifInfo.modifyDate) : $t('unknown'),
      keys: ['modifyDate'],
    },
    {
      icon: mdiMapMarkerOutline,
      title: $t('location'),
      render: locationParts.length > 0 ? locationParts.join(', ') : $t('unknown'),
      keys: ['city', 'state', 'country'],
    },
    {
      icon: mdiCrosshairsGps,
      title: $t('gps'),
      render:
        asset.exifInfo?.latitude != null && asset.exifInfo?.longitude != null
          ? `${asset.exifInfo.latitude.toFixed(4)}, ${asset.exifInfo.longitude.toFixed(4)}`
          : $t('unknown'),
      keys: ['latitude', 'longitude'],
    },
    { icon: mdiCameraOutline, title: $t('make'), render: asset.exifInfo?.make || $t('unknown'), keys: ['make'] },
    { icon: mdiCamera, title: $t('model'), render: asset.exifInfo?.model || $t('unknown'), keys: ['model'] },
    {
      icon: mdiCameraIris,
      title: $t('lens_model'),
      render: asset.exifInfo?.lensModel || $t('unknown'),
      keys: ['lensModel'],
    },
    {
      icon: mdiCameraIris,
      title: $t('f_number'),
      render: asset.exifInfo?.fNumber == null ? $t('unknown') : `f/${asset.exifInfo.fNumber.toFixed(1)}`,
      keys: ['fNumber'],
    },
    {
      icon: mdiRayStartArrow,
      title: $t('focal_length'),
      render: asset.exifInfo?.focalLength == null ? $t('unknown') : `${asset.exifInfo.focalLength} mm`,
      keys: ['focalLength'],
    },
    {
      icon: mdiBrightness6,
      title: $t('iso'),
      render: asset.exifInfo?.iso == null ? $t('unknown') : `ISO ${asset.exifInfo.iso}`,
      keys: ['iso'],
    },
    {
      icon: mdiTimerOutline,
      title: $t('exposure_time'),
      render: asset.exifInfo?.exposureTime || $t('unknown'),
      keys: ['exposureTime'],
    },
    {
      icon: mdiTextBox,
      title: $t('description'),
      render: asset.exifInfo?.description || $t('unknown'),
      keys: ['description'],
    },
    {
      icon: mdiStarOutline,
      title: $t('rating'),
      render: asset.exifInfo?.rating == null ? $t('unknown') : `${asset.exifInfo.rating} stars`,
      keys: ['rating'],
    },
    {
      icon: mdiPhoneRotateLandscape,
      title: $t('orientation'),
      render: String(asset.exifInfo?.orientation || $t('unknown')),
      keys: ['orientation'],
    },
    {
      icon: mdiPanorama,
      title: $t('projection_type'),
      render: asset.exifInfo?.projectionType || $t('unknown'),
      keys: ['projectionType'],
    },
  ] satisfies MetadataItem[]);

  let filteredMetadataItems = $derived(allMetadataItems.filter(({ keys }) => keys.some((k) => isVisible(k))));
</script>

<div class="relative w-full">
  <div class="min-w-60 max-w-full overflow-hidden transition-colors border rounded-lg flex-1">
    <button
      type="button"
      onclick={() => onSelectAsset(asset)}
      class="block relative w-full"
      aria-pressed={isSelected}
      aria-label={$t('keep')}
    >
      <!-- THUMBNAIL -->
      <img
        src={getAssetMediaUrl({ id: asset.id })}
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
    {#each filteredMetadataItems as { icon, title, render, keys } (keys[0])}
      <InfoRow {icon} {title}>
        {render}
      </InfoRow>
    {/each}

    <!-- Albums always shown -->
    <InfoRow icon={mdiAlbum} borderBottom={false} title={$t('albums')}>
      {#await getAllAlbums({ assetId: asset.id })}
        {$t('scanning_for_album')}
      {:then albums}
        {$t('in_albums', { values: { count: albums.length } })}
      {/await}
    </InfoRow>
  </div>
</div>
