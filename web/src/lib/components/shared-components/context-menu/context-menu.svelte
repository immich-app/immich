<script lang="ts">
  import { clickOutside } from '$lib/utils/click-outside';
  import { quintOut } from 'svelte/easing';
  import { slide } from 'svelte/transition';

  export let direction: 'left' | 'right' = 'right';
  export let x = 0;
  export let y = 0;

  let menuElement: HTMLDivElement;
  let left: number;
  let top: number;

  $: if (menuElement) {
    const rect = menuElement.getBoundingClientRect();
    const directionWidth = direction === 'left' ? rect.width : 0;

    left = Math.min(window.innerWidth - rect.width, x - directionWidth);
    top = Math.min(window.innerHeight - rect.height, y);
  }
</script>

<div
  transition:slide={{ duration: 200, easing: quintOut }}
  bind:this={menuElement}
  class="absolute w-[200px] overflow-hidden rounded-lg shadow-lg"
  style="left: {left}px; top: {top}px;"
  role="menu"
  use:clickOutside
  on:outclick
>
  <slot />
</div>
