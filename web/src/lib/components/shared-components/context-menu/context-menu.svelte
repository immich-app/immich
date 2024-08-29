<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { slide } from 'svelte/transition';
  import { clickOutside } from '$lib/actions/click-outside';

  export let isVisible: boolean = false;
  export let direction: 'left' | 'right' = 'right';
  export let x = 0;
  export let y = 0;
  export let id: string | undefined = undefined;
  export let ariaLabel: string | undefined = undefined;
  export let ariaLabelledBy: string | undefined = undefined;
  export let ariaActiveDescendant: string | undefined = undefined;

  export let menuElement: HTMLUListElement | undefined = undefined;
  export let onClose: (() => void) | undefined = undefined;

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
  bind:clientHeight={height}
  class="fixed z-10 min-w-[200px] w-max max-w-[300px] overflow-hidden rounded-lg shadow-lg"
  style:left="{left}px"
  style:top="{top}px"
  transition:slide={{ duration: 250, easing: quintOut }}
  use:clickOutside={{ onOutclick: onClose }}
>
  <ul
    {id}
    aria-activedescendant={ariaActiveDescendant ?? ''}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy}
    bind:this={menuElement}
    class:max-h-[100vh]={isVisible}
    class:max-h-0={!isVisible}
    class="flex flex-col transition-all duration-[250ms] ease-in-out outline-none"
    role="menu"
    tabindex="-1"
  >
    <slot />
  </ul>
</div>
