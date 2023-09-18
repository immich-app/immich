<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';

  export let title: string = 'Without';

  export let currentFilter: string;
  export let thumbData: string;

  let dispatch = createEventDispatcher();

  let imgElement: HTMLImageElement;

  import Check from 'svelte-material-icons/Check.svelte';
  import { presets as presetsObject } from './filter';

  type Preset = {
    blur: number;
    brightness: number;
    contrast: number;
    grayscale: number;
    hueRotate: number;
    invert: number;
    opacity: number;
    saturation: number;
    sepia: number;
  };

  const presets = presetsObject as { [key: string]: Preset };

  onMount(() => {
    if (title === 'Custom') {
      return;
    }
    const img = new Image();
    img.src = thumbData;
    img.onload = () => {
      imgElement.src = img.src;
    };
    const filter = presets[title.toLowerCase()];

    imgElement.style.filter = `blur(${filter.blur * 10}px) brightness(${filter.brightness}) contrast(${
      filter.contrast
    }) grayscale(${filter.grayscale}) hue-rotate(${(filter.hueRotate - 1) * 180}deg) invert(${filter.invert}) opacity(${
      filter.opacity
    }) saturate(${filter.saturation}) sepia(${filter.sepia})`;
  });
</script>

<button
  class=" text-immich-gray/70 w-fit text-center text-sm {title.toLowerCase() === currentFilter ? 'isActive' : ''}"
  on:click={() => {
    if (title === 'Custom') {
      return;
    }
    dispatch('setPreset', title.toLowerCase());
  }}
>
  <div
    class="bg-immich-primary flex h-[92px] w-[92px] items-center justify-center text-3xl {title.toLowerCase() ===
    currentFilter
      ? ''
      : 'hidden'}"
  >
    <Check />
  </div>
  <img
    bind:this={imgElement}
    class="bg-immich-gray/10 h-[92px] w-[92px] {title.toLowerCase() === currentFilter ? 'hidden' : ''}"
    src=""
    alt="asset preview"
  />
  <div class="my-[4px]">{title}</div>
</button>

<style>
  .isActive {
    color: white;
  }
</style>
