<script lang="ts">
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import { AppRoute } from '$lib/constants';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { type AssetResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    assetInteraction: AssetInteraction;
    onSelectAsset: (asset: AssetResponseDto) => void;
    onMouseEvent: (asset: AssetResponseDto) => void;
    onLocation: (location: { latitude: number; longitude: number }) => void;
  }

  let { asset, assetInteraction, onSelectAsset, onMouseEvent, onLocation }: Props = $props();

  let assetData = $derived(
    JSON.stringify(
      {
        originalFileName: asset.originalFileName,
        localDateTime: asset.localDateTime,
        make: asset.exifInfo?.make,
        model: asset.exifInfo?.model,
        gps: {
          latitude: asset.exifInfo?.latitude,
          longitude: asset.exifInfo?.longitude,
        },
        location: asset.exifInfo?.city ? `${asset.exifInfo?.country} - ${asset.exifInfo?.city}` : undefined,
      },
      null,
      2,
    ),
  );
  let boxWidth = $state(300);
  let timelineAsset = $derived(toTimelineAsset(asset));
  const hasGps = $derived(!!asset.exifInfo?.latitude && !!asset.exifInfo?.longitude);
</script>

<div
  class="w-full aspect-square rounded-xl border-3 transition-colors font-semibold text-xs dark:bg-black bg-gray-200 border-gray-200 dark:border-gray-800"
  bind:clientWidth={boxWidth}
  title={assetData}
>
  <div class="relative w-full h-full overflow-hidden rounded-lg">
    <Thumbnail
      asset={timelineAsset}
      onClick={() => {
        if (asset.exifInfo?.latitude && asset.exifInfo?.longitude) {
          onLocation({ latitude: asset.exifInfo?.latitude, longitude: asset.exifInfo?.longitude });
        } else {
          onSelectAsset(asset);
        }
      }}
      onSelect={() => onSelectAsset(asset)}
      onMouseEvent={() => onMouseEvent(asset)}
      selected={assetInteraction.hasSelectedAsset(asset.id)}
      selectionCandidate={assetInteraction.hasSelectionCandidate(asset.id)}
      thumbnailSize={boxWidth}
      readonly={hasGps}
    />

    {#if hasGps}
      <div class="absolute bottom-1 end-3 px-4 py-1 rounded-xl text-xs transition-colors bg-success text-black">
        {$t('gps')}
      </div>
    {:else}
      <div class="absolute bottom-1 end-3 px-4 py-1 rounded-xl text-xs transition-colors bg-danger text-light">
        {$t('gps_missing')}
      </div>
    {/if}
  </div>
  <div class="text-center mt-4 px-4 text-sm font-semibold truncate" title={asset.originalFileName}>
    <a href={`${AppRoute.PHOTOS}/${asset.id}`} target="_blank" rel="noopener noreferrer">
      {asset.originalFileName}
    </a>
  </div>
  <div class="text-center my-3">
    <p class="px-4 text-xs font-normal truncate text-dark/75">
      {new Date(asset.localDateTime).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })}
    </p>
    <p class="px-4 text-xs font-normal truncate text-dark/75">
      {new Date(asset.localDateTime).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC',
      })}
    </p>
    {#if hasGps}
      <p class="text-primary mt-2 text-xs font-normal px-4 text-center truncate">
        {asset.exifInfo?.country}
      </p>
      <p class="text-primary text-xs font-normal px-4 text-center truncate">
        {asset.exifInfo?.city}
      </p>
    {/if}
  </div>
</div>
