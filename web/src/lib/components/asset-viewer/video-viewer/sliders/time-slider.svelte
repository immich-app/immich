<script lang="ts">
  import SliderChapters from '$lib/components/asset-viewer/video-viewer/sliders/slider-chapters.svelte';
  import SliderPreview from '$lib/components/asset-viewer/video-viewer/sliders/slider-preview.svelte';
  import SliderThumb from '$lib/components/asset-viewer/video-viewer/sliders/slider-thumb.svelte';
  type Props = {
    thumbnails?: string;
  };
  const { thumbnails }: Props = $props();
</script>

<media-time-slider
  class="group text-white relative mx-[7.5px] -mt-1.5 inline-flex h-10 w-full cursor-pointer touch-none select-none items-center outline-none"
>
  <SliderChapters />
  <SliderThumb />
  <SliderPreview {thumbnails}>
    <div class="mt-2 text-sm" data-part="chapter-title"></div>
    <media-slider-value class="relative top-3 text-[13px]"></media-slider-value>
  </SliderPreview>
</media-time-slider>
