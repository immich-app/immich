<script lang="ts">
  import { SlideshowMetadataOverlayMode, slideshowStore } from '$lib/stores/slideshow.store';
  import { fromISODateTime, fromISODateTimeUTC } from '$lib/utils/timeline-util';
  import type { AssetResponseDto } from '@immich/sdk';
  import { Text } from '@immich/ui';
  import { DateTime } from 'luxon';

  type Props = {
    asset: AssetResponseDto;
  };

  const { asset }: Props = $props();

  const { slideshowShowMetadataOverlay, slideshowMetadataOverlayMode } = slideshowStore;

  const opacity = 0.7;

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
  <div class="absolute inset-x-0 bottom-0 z-10">
    <div
      class="w-full px-6 py-4"
      style="background: linear-gradient(to top, rgba(0, 0, 0, {opacity}) 0%, rgba(0, 0, 0, {opacity * 0.8}) 100%);"
    >
      <div class="flex flex-col gap-2 text-white">
        {#if description}
          <Text fontWeight="medium" class="leading-relaxed wrap-break-word whitespace-pre-wrap">{description}</Text>
        {/if}
        {#if $slideshowMetadataOverlayMode !== SlideshowMetadataOverlayMode.DescriptionOnly}
          <div class="flex flex-col gap-1 text-sm opacity-90">
            {#if dateString}
              <Text>{dateString}</Text>
            {/if}
            {#if locationString}
              <Text>{locationString}</Text>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
