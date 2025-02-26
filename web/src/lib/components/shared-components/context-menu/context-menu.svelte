<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { slide } from 'svelte/transition';
  import { clickOutside } from '$lib/actions/click-outside';
  import type { Snippet } from 'svelte';

  interface Props {
    isVisible?: boolean;
    direction?: 'left' | 'right';
    x?: number;
    y?: number;
    id?: string | undefined;
    ariaLabel?: string | undefined;
    ariaLabelledBy?: string | undefined;
    ariaActiveDescendant?: string | undefined;
    menuElement?: HTMLUListElement | undefined;
    onClose?: (() => void) | undefined;
    children?: Snippet;
  }

  let {
    isVisible = false,
    direction = 'right',
    x = 0,
    y = 0,
    id = undefined,
    ariaLabel = undefined,
    ariaLabelledBy = undefined,
    ariaActiveDescendant = undefined,
    menuElement = $bindable(),
    onClose = undefined,
    children,
  }: Props = $props();

  let left: number = $state(0);
  let top: number = $state(0);

  // We need to bind clientHeight since the bounding box may return a height
  // of zero when starting the 'slide' animation.
  let height: number = $state(0);

  $effect(() => {
    if (menuElement) {
      const rect = menuElement.getBoundingClientRect();
      const directionWidth = direction === 'left' ? rect.width : 0;
      const menuHeight = Math.min(menuElement.clientHeight, height) || 0;

      left = Math.min(window.innerWidth - rect.width, x - directionWidth);
      top = Math.min(window.innerHeight - menuHeight, y);
    }
  });
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
    class="{isVisible
      ? 'max-h-screen max-h-svh'
      : 'max-h-0'} flex flex-col transition-all duration-[250ms] ease-in-out outline-none overflow-auto"
    role="menu"
    tabindex="-1"
  >
    {@render children?.()}
  </ul>
</div>
