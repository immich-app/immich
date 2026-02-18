<script lang="ts">
  import type { MetadataPreference } from '$lib/stores/duplicates-metadata.store';
  import { locale } from '$lib/stores/preferences.store';
  import { getAssetMediaUrl } from '$lib/utils';
  import { getAssetResolution, getFileSize } from '$lib/utils/asset-utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { fromISODateTime, fromISODateTimeUTC, toTimelineAsset } from '$lib/utils/timeline-util';
  import { type AssetResponseDto, getAllAlbums } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import {
    mdiBookmarkOutline,
    mdiBrightness6,
    mdiCalendar,
    mdiCamera,
    mdiCameraIris,
    mdiCameraOutline,
    mdiClock,
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
    selectedMetadataFields: MetadataPreference;
    differingMetadataFields: { [key: string]: boolean | undefined };
    showAllMetadata?: boolean;
  }

  let {
    asset,
    isSelected,
    onSelectAsset,
    onViewAsset,
    selectedMetadataFields,
    differingMetadataFields,
    showAllMetadata = false,
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

  // Whether a field is selected AND (differs OR showAllMetadata)
  const isVisible = (key: keyof MetadataPreference): boolean =>
    !!selectedMetadataFields[key] && !!differingMetadataFields[key];

  // Whether to highlight a row (only when in differences-only mode and it differs)
  const isHighlighted = (key: keyof MetadataPreference): boolean => !showAllMetadata && !!differingMetadataFields[key];

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
    <!-- Visibility is derived from preference in metadata store -->
    {#if isVisible('originalFileName')}
      <InfoRow icon={mdiFileImageOutline} highlight={false} title={$t('file_name_text')}>
        {asset.originalFileName}
      </InfoRow>
    {/if}
    {#if isVisible('originalPath')}
      <InfoRow icon={mdiFolderOutline} highlight={false} title={$t('path')}>
        {truncateMiddle(getBasePath(asset.originalPath, asset.originalFileName)) || $t('unknown')}
      </InfoRow>
    {/if}

    {#if isVisible('fileCreatedAt')}
      <InfoRow icon={mdiFileClockOutline} highlight={isHighlighted('fileCreatedAt')} title={$t('created_at')}>
        {asset.fileCreatedAt}
      </InfoRow>
    {/if}
    {#if isVisible('fileSize')}
      <InfoRow icon={mdiWeightKilogram} highlight={false} title={$t('file_size')}>
        {getFileSize(asset)}
      </InfoRow>
    {/if}

    {#if isVisible('resolution')}
      <InfoRow icon={mdiFitToScreen} highlight={false} title={$t('resolution')}>
        {getAssetResolution(asset) || $t('unknown')}
      </InfoRow>
    {/if}

    {#if isVisible('fileModifiedAt')}
      <InfoRow icon={mdiFileEditOutline} highlight={isHighlighted('fileModifiedAt')} title={$t('updated_at')}>
        {asset.fileModifiedAt}
      </InfoRow>
    {/if}

    {#if isVisible('dateTimeOriginal')}
      <InfoRow
        icon={mdiCalendar}
        highlight={isHighlighted('dateTimeOriginal')}
        title={$t('duplicates_metadata_modal.date_time_original')}
      >
        {#if dateTime}
          {dateTime.toLocaleString({ month: 'short', day: 'numeric', year: 'numeric' }, { locale: $locale })}
        {:else}
          {$t('unknown')}
        {/if}
      </InfoRow>
    {/if}

    {#if isVisible('dateTimeOriginal')}
      <InfoRow icon={mdiClock} highlight={isHighlighted('dateTimeOriginal')} title={$t('time')}>
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
    {/if}

    {#if isVisible('city') || isVisible('state') || isVisible('country')}
      <InfoRow
        icon={mdiMapMarkerOutline}
        highlight={isHighlighted('city') || isHighlighted('state') || isHighlighted('country')}
        title={$t('location')}
      >
        {#if locationParts.length > 0}
          {locationParts.join(', ')}
        {:else}
          {$t('unknown')}
        {/if}
      </InfoRow>
    {/if}

    {#if isVisible('timeZone')}
      <InfoRow icon={mdiEarth} highlight={isHighlighted('timeZone')} title={$t('timezone')}>
        {asset.exifInfo?.timeZone || $t('unknown')}
      </InfoRow>
    {/if}

    {#if isVisible('latitude') || isVisible('longitude')}
      <InfoRow
        icon={mdiCrosshairsGps}
        highlight={isHighlighted('latitude') || isHighlighted('longitude')}
        title={$t('gps')}
      >
        {#if asset.exifInfo?.latitude != null && asset.exifInfo?.longitude != null}
          {asset.exifInfo.latitude.toFixed(4)}, {asset.exifInfo.longitude.toFixed(4)}
        {:else}
          {$t('unknown')}
        {/if}
      </InfoRow>
    {/if}

    {#if isVisible('make')}
      <InfoRow icon={mdiCameraOutline} highlight={isHighlighted('make')} title={$t('make')}>
        {asset.exifInfo?.make || $t('unknown')}
      </InfoRow>
    {/if}

    {#if isVisible('model')}
      <InfoRow icon={mdiCamera} highlight={isHighlighted('model')} title={$t('model')}>
        {asset.exifInfo?.model || $t('unknown')}
      </InfoRow>
    {/if}

    {#if isVisible('lensModel')}
      <InfoRow icon={mdiCameraIris} highlight={isHighlighted('lensModel')} title={$t('lens_model')}>
        {asset.exifInfo?.lensModel || $t('unknown')}
      </InfoRow>
    {/if}

    {#if isVisible('fNumber')}
      <InfoRow
        icon={mdiCameraIris}
        highlight={isHighlighted('fNumber')}
        title={$t('duplicates_metadata_modal.f_number')}
      >
        {#if asset.exifInfo?.fNumber != null}
          f/{asset.exifInfo.fNumber.toFixed(1)}
        {:else}
          {$t('unknown')}
        {/if}
      </InfoRow>
    {/if}

    {#if isVisible('focalLength')}
      <InfoRow
        icon={mdiRayStartArrow}
        highlight={isHighlighted('focalLength')}
        title={$t('duplicates_metadata_modal.focal_length')}
      >
        {#if asset.exifInfo?.focalLength != null}
          {asset.exifInfo.focalLength} mm
        {:else}
          {$t('unknown')}
        {/if}
      </InfoRow>
    {/if}

    {#if isVisible('iso')}
      <InfoRow icon={mdiBrightness6} highlight={isHighlighted('iso')} title={$t('duplicates_metadata_modal.iso')}>
        {#if asset.exifInfo?.iso != null}
          ISO {asset.exifInfo.iso}
        {:else}
          {$t('unknown')}
        {/if}
      </InfoRow>
    {/if}

    {#if isVisible('exposureTime')}
      <InfoRow
        icon={mdiTimerOutline}
        highlight={isHighlighted('exposureTime')}
        title={$t('duplicates_metadata_modal.exposure_time')}
      >
        {asset.exifInfo?.exposureTime || $t('unknown')}
      </InfoRow>
    {/if}

    {#if isVisible('description')}
      <InfoRow icon={mdiTextBox} highlight={isHighlighted('description')} title={$t('description')}>
        {asset.exifInfo?.description || $t('unknown')}
      </InfoRow>
    {/if}

    {#if isVisible('rating')}
      <InfoRow icon={mdiStarOutline} highlight={isHighlighted('rating')} title={$t('rating')}>
        {asset.exifInfo?.rating != null ? `${asset.exifInfo.rating} stars` : $t('unknown')}
      </InfoRow>
    {/if}

    {#if isVisible('orientation')}
      <InfoRow
        icon={mdiPhoneRotateLandscape}
        highlight={isHighlighted('orientation')}
        title={$t('duplicates_metadata_modal.orientation')}
      >
        {asset.exifInfo?.orientation || $t('unknown')}
      </InfoRow>
    {/if}

    {#if isVisible('projectionType')}
      <InfoRow
        icon={mdiPanorama}
        highlight={isHighlighted('projectionType')}
        title={$t('duplicates_metadata_modal.projection_type')}
      >
        {asset.exifInfo?.projectionType || $t('unknown')}
      </InfoRow>
    {/if}

    {#if isVisible('modifyDate')}
      <InfoRow
        icon={mdiClockEditOutline}
        highlight={isHighlighted('modifyDate')}
        title={$t('duplicates_metadata_modal.modify_date')}
      >
        {asset.exifInfo?.modifyDate || $t('unknown')}
      </InfoRow>
    {/if}

    <!-- Albums always shown, not part of metadata preference -->
    <InfoRow icon={mdiBookmarkOutline} borderBottom={false} title={$t('albums')}>
      {#await getAllAlbums({ assetId: asset.id })}
        {$t('scanning_for_album')}
      {:then albums}
        {$t('in_albums', { values: { count: albums.length } })}
      {/await}
    </InfoRow>
  </div>
</div>
