<script lang="ts">
  import { SlideshowMetadataOverlayMode, slideshowStore } from '$lib/stores/slideshow.store';
  import { decodeBase64 } from '$lib/utils';
  import { fromISODateTime, fromISODateTimeUTC } from '$lib/utils/timeline-util';
  import type { AssetResponseDto } from '@immich/sdk';
  import { DateTime } from 'luxon';
  import { thumbHashToRGBA } from 'thumbhash';

  interface Props {
    asset: AssetResponseDto;
  }

  let { asset }: Props = $props();

  const { slideshowShowMetadataOverlay, slideshowMetadataOverlayMode } = slideshowStore;

  let scrimOpacity = $state(0.7);

  // Compute description
  const description = $derived(asset.exifInfo?.description?.trim() || '');

  // Compute date taken
  const dateTime = $derived(
    asset.exifInfo?.timeZone && asset.exifInfo?.dateTimeOriginal
      ? fromISODateTime(asset.exifInfo.dateTimeOriginal, asset.exifInfo.timeZone)
      : fromISODateTimeUTC(asset.localDateTime),
  );
  const dateString = $derived(dateTime.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY));

  // Compute location
  const locationParts = $derived(
    (() => {
      const parts: string[] = [];
      if (asset.exifInfo?.city) {
        parts.push(asset.exifInfo.city);
      }
      if (asset.exifInfo?.state) {
        parts.push(asset.exifInfo.state);
      }
      if (asset.exifInfo?.country) {
        parts.push(asset.exifInfo.country);
      }
      return parts;
    })(),
  );
  const locationString = $derived(locationParts.join(', '));

  // Compute visibility
  const shouldShow = $derived(() => {
    if (!$slideshowShowMetadataOverlay) {
      return false;
    }

    if ($slideshowMetadataOverlayMode === SlideshowMetadataOverlayMode.DescriptionOnly) {
      return !!description;
    }

    // Full mode: show if any field is available
    return !!description || !!dateString || !!locationString;
  });

  // Compute adaptive scrim opacity from thumbhash
  const computeScrimOpacity = (thumbhash: string | null | undefined): number => {
    if (!thumbhash) {
      return 0.7; // Safe fallback
    }

    try {
      const decoded = decodeBase64(thumbhash);
      const { h, w, rgba } = thumbHashToRGBA(decoded);

      // Sample the bottom ~30% region where overlay sits
      const bottomStart = Math.floor(h * 0.7);
      let totalLuminance = 0;
      let sampleCount = 0;

      for (let y = bottomStart; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const r = rgba[idx];
          const g = rgba[idx + 1];
          const b = rgba[idx + 2];
          // Calculate relative luminance (perceived brightness)
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          totalLuminance += luminance;
          sampleCount++;
        }
      }

      if (sampleCount === 0) {
        return 0.7;
      }

      const avgLuminance = totalLuminance / sampleCount;
      // Map luminance to opacity: bright images get darker scrim
      // opacity = clamp(0.45 + luminance * 0.40, 0.45, 0.85)
      const opacity = Math.max(0.45, Math.min(0.85, 0.45 + avgLuminance * 0.4));
      return opacity;
    } catch (error) {
      console.warn('Failed to compute scrim opacity from thumbhash:', error);
      return 0.7; // Safe fallback
    }
  };

  $effect(() => {
    scrimOpacity = asset.thumbhash ? computeScrimOpacity(asset.thumbhash) : 0.7;
  });
</script>

{#if shouldShow()}
  <div class="absolute bottom-0 left-0 right-0 z-10">
    <!-- Dark scrim with adaptive opacity -->
    <div
      class="w-full px-6 py-4"
      style="background: linear-gradient(to top, rgba(0, 0, 0, {scrimOpacity}) 0%, rgba(0, 0, 0, {scrimOpacity *
        0.8}) 100%);"
    >
      <div class="flex flex-col gap-2 text-white">
        {#if $slideshowMetadataOverlayMode === SlideshowMetadataOverlayMode.DescriptionOnly}
          {#if description}
            <p class="text-base font-medium leading-relaxed whitespace-pre-wrap wrap-break-word">
              {description}
            </p>
          {/if}
        {:else}
          <!-- Full mode: show all available metadata -->
          {#if description}
            <p class="text-base font-medium leading-relaxed whitespace-pre-wrap wrap-break-word">
              {description}
            </p>
          {/if}
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
