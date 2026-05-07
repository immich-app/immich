<script lang="ts">
  import { SlideshowMetadataOverlayMode, slideshowStore } from '$lib/stores/slideshow.store';
  import { fromISODateTime, fromISODateTimeUTC } from '$lib/utils/timeline-util';
  import type { AssetResponseDto } from '@immich/sdk';
  import { DateTime } from 'luxon';

  interface Props {
    asset: AssetResponseDto;
  }

  let { asset }: Props = $props();

  const { slideshowShowMetadataOverlay, slideshowMetadataOverlayMode } = slideshowStore;

  const scrimOpacity = 0.7;

  const description = $derived(asset.exifInfo?.description?.trim() || '');

  const dateTime = $derived(
    asset.exifInfo?.timeZone && asset.exifInfo?.dateTimeOriginal
      ? fromISODateTime(asset.exifInfo.dateTimeOriginal, asset.exifInfo.timeZone)
      : fromISODateTimeUTC(asset.localDateTime),
  );
  const dateString = $derived(dateTime.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY));

  const locationString = $derived(
    [asset.exifInfo?.city, asset.exifInfo?.state, asset.exifInfo?.country].filter(Boolean).join(', '),
  );

  const shouldShow = $derived.by(() => {
    if (!$slideshowShowMetadataOverlay) {
      return false;
    }
    if ($slideshowMetadataOverlayMode === SlideshowMetadataOverlayMode.DescriptionOnly) {
      return !!description;
    }
    return !!description || !!dateString || !!locationString;
  });
</script>

{#if shouldShow}
  <div class="absolute bottom-0 left-0 right-0 z-10">
    <div
      class="w-full px-6 py-4"
      style="background: linear-gradient(to top, rgba(0, 0, 0, {scrimOpacity}) 0%, rgba(0, 0, 0, {scrimOpacity *
        0.8}) 100%);"
    >
      <div class="flex flex-col gap-2 text-white">
        {#if description}
          <p class="text-base font-medium leading-relaxed whitespace-pre-wrap wrap-break-word">
            {description}
          </p>
        {/if}
        {#if $slideshowMetadataOverlayMode !== SlideshowMetadataOverlayMode.DescriptionOnly}
          <div class="flex flex-col gap-1 text-sm opacity-90">
            {#if dateString}
              <p>{dateString}</p>
            {/if}
            {#if locationString}
              <p>{locationString}</p>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
