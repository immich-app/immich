<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import type { MetadataPreference } from '$lib/stores/duplicates-metadata.store';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { getAssetResolution, getFileSize } from '$lib/utils/asset-utils';
  import { formatDateTime } from '$lib/utils/date-time';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { type AssetResponseDto, type ExifResponseDto, getAllAlbums } from '@immich/sdk';
  import { mdiHeart, mdiImageMultipleOutline, mdiMagnifyPlus } from '@mdi/js';
  import { t } from 'svelte-i18n';

  // Helper for coordinates, e.g., toFixed(4)
  export function formatCoordinate(coord: number | null | undefined): string | null {
    if (typeof coord !== 'number') {
      return null;
    }
    return coord.toFixed(4);
  }

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

  function getMetadataValue(key: keyof MetadataPreference): string | number | boolean | null | undefined {
    // Handle top-level AssetResponseDto properties
    if (key === 'fileCreatedAt' || key === 'fileModifiedAt') {
      return asset[key];
    }
    if (key === 'originalFileName' || key === 'originalPath') {
      return asset[key];
    }
    // Handle ExifResponseDto properties
    else if (asset.exifInfo && key in asset.exifInfo) {
      return asset.exifInfo[key as keyof ExifResponseDto];
    }
    return null;
  }

  function formatMetadataDisplay(key: keyof MetadataPreference): string | null {
    const value = getMetadataValue(key);
    if (value === null || value === undefined) {
      return null;
    }

    switch (key) {
      case 'fileCreatedAt':
      case 'fileModifiedAt':
      case 'dateTimeOriginal':
      case 'modifyDate': {
        return formatDateTime(value as string);
      }
      case 'latitude':
      case 'longitude': {
        return formatCoordinate(value as number);
      }
      case 'fNumber': {
        if (typeof value === 'number') {
          return `f/${value.toFixed(1)}`;
        }
        return String(value);
      }
      case 'focalLength': {
        if (typeof value === 'number') {
          return `${value} mm`;
        }
        return String(value);
      }
      case 'iso': {
        return `ISO ${value}`;
      }
      case 'exposureTime': {
        return value as string;
      }
      case 'rating': {
        return `${value} stars`;
      }
      case 'city':
      case 'country':
      case 'state':
      case 'timeZone':
      case 'description':
      case 'lensModel':
      case 'make':
      case 'model':
      case 'orientation':
      case 'projectionType': {
        return String(value);
      }
      default: {
        return String(value);
      }
    }
  }

  const metadataLabels: Record<keyof MetadataPreference, string> = {
    originalFileName: $t('filename'),
    originalPath: $t('path'),
    fileCreatedAt: $t('created_at'),
    fileModifiedAt: $t('updated_at'),
    dateTimeOriginal: $t('metadata_selection_modal.date_time_original'),
    description: $t('description'),
    exposureTime: $t('metadata_selection_modal.exposure_time'),
    fNumber: $t('metadata_selection_modal.f_number'),
    focalLength: $t('metadata_selection_modal.focal_length'),
    iso: $t('metadata_selection_modal.iso'),
    lensModel: $t('lens_model'),
    make: $t('make'),
    model: $t('model'),
    modifyDate: $t('metadata_selection_modal.modify_date'),
    orientation: $t('metadata_selection_modal.orientation'),
    projectionType: $t('metadata_selection_modal.projection_type'),
    rating: $t('rating'),
    city: $t('city'),
    country: $t('country'),
    state: $t('state'),
    timeZone: $t('timezone'),
    latitude: $t('latitude'),
    longitude: $t('longitude'),
  };
</script>

<div
  class="w-64 sm:w-72 md:w-80 max-w-full rounded-xl border-4 transition-colors font-semibold text-xs {isSelected
    ? 'bg-subtle border-primary'
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
          <Icon path={mdiHeart} size="24" class="text-white" />
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
              <Icon path={mdiImageMultipleOutline} size="18" />
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
      <Icon ariaLabel={$t('view')} path={mdiMagnifyPlus} flipped size="18" />
    </button>
  </div>

  <div class="grid place-items-center gap-y-2 py-2 text-xs transition-colors dark:text-white">
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
    <!-- METADATA -->
    {#each Object.keys(selectedMetadataFields) as key (key)}
      {@const metadataKey = key as keyof MetadataPreference}
      {#if selectedMetadataFields[metadataKey] && differingMetadataFields[metadataKey]}
        {@const formattedValue = formatMetadataDisplay(metadataKey)}
        {#if formattedValue}
          <div class="flex flex-col items-center w-full px-2">
            <div
              class={'w-full rounded-md px-2 py-1 border flex flex-col items-center gap-0.5 ' +
                (showAllMetadata
                  ? 'border-subtle/60'
                  : 'bg-amber-50 dark:bg-amber-900/30 border-amber-200/50 dark:border-amber-700/30')}
            >
              <strong class={'text-center ' + (showAllMetadata ? '' : 'text-amber-800 dark:text-amber-200')}
                >{metadataLabels[metadataKey]}:</strong
              >
              <span class={'break-all text-center ' + (showAllMetadata ? '' : 'text-amber-900 dark:text-amber-100')}
                >{formattedValue}</span
              >
            </div>
          </div>
        {/if}
      {/if}
    {/each}
  </div>
</div>
