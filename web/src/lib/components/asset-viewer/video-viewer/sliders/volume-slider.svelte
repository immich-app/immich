<script lang="ts">
  import SliderThumb from '$lib/components/asset-viewer/video-viewer/sliders/slider-thumb.svelte';
  import SliderPreview from './slider-preview.svelte';
</script>

<media-volume-slider
  class="group relative mx-[7.5px] inline-flex h-10 w-full max-w-[80px] cursor-pointer touch-none select-none items-center outline-none aria-hidden:hidden"
>
  <!-- Track -->
  <div class="ring-media-focus relative z-0 h-[5px] w-full rounded-sm bg-white/30 group-data-[focus]:ring-[3px]">
    <div class="bg-white absolute h-full w-[var(--slider-fill)] rounded-sm will-change-[width]"></div>
  </div>
  <SliderThumb></SliderThumb>
  <SliderPreview noClamp>
    <media-slider-value class="rounded-sm bg-black px-2 py-px text-[13px] font-medium"></media-slider-value>
  </SliderPreview>
</media-volume-slider>
