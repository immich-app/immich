<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { slide } from 'svelte/transition';
  import { clickOutside } from '$lib/actions/click-outside';

  export let direction: 'left' | 'right' = 'right';
  export let x = 0;
  export let y = 0;

  export let menuElement: HTMLDivElement | undefined = undefined;

  let left: number;
  let top: number;

  // We need to bind clientHeight since the bounding box may return a height
  // of zero when starting the 'slide' animation.
  let height: number;

  $: {
    if (menuElement) {
      const rect = menuElement.getBoundingClientRect();
      const directionWidth = direction === 'left' ? rect.width : 0;
      const menuHeight = Math.min(menuElement.clientHeight, height) || 0;

      left = Math.min(window.innerWidth - rect.width, x - directionWidth);
      top = Math.min(window.innerHeight - menuHeight, y);
    }
  }
</script>

<div
  bind:this={menuElement}
  bind:clientHeight={height}
  transition:slide={{ duration: 250, easing: quintOut }}
  class="absolute z-10 min-w-[200px] w-max max-w-[300px] overflow-hidden rounded-lg shadow-lg"
  style:top="{top}px"
  style:left="{left}px"
  role="menu"
  use:clickOutside
  on:outclick
  on:escape
>
  <div class="flex flex-col rounded-lg">
    <slot />
  </div>
</div>
