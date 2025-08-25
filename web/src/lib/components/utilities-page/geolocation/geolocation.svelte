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
  class="w-full aspect-square rounded-xl border-4 transition-colors font-semibold text-xs bg-gray-200 dark:bg-gray-800 border-gray-200 dark:border-gray-800"
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
      <div class="absolute bottom-1 end-3 px-4 py-1 rounded-xl text-xs transition-colors bg-green-500">
        {$t('gps')}
      </div>
    {:else}
      <div class="absolute bottom-1 end-3 px-4 py-1 rounded-xl text-xs transition-colors bg-red-500">
        {$t('gps_missing')}
      </div>
    {/if}
  </div>
  <div class="text-center mt-4 px-4 text-sm font-normal truncate" title={asset.originalFileName}>
    <a href={`${AppRoute.PHOTOS}/${asset.id}`} target="_blank" rel="noopener noreferrer">
      {asset.originalFileName}
    </a>
  </div>
  <div class="text-start">
    <p class="mt-4 px-4 text-xs font-normal truncate">
      {new Date(asset.localDateTime).toLocaleString()}
    </p>
    {#if hasGps}
      <p class="mt-1 px-4 text-xs font-normal truncate">{asset.exifInfo?.country} - {asset.exifInfo?.city}</p>
    {:else}
      <p class="mt-1 px-4 text-xs font-normal truncate">&nbsp;</p>
    {/if}
  </div>
</div>
