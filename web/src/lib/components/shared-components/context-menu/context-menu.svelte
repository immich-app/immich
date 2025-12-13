<script lang="ts">
  import { clickOutside } from '$lib/actions/click-outside';
  import { languageManager } from '$lib/managers/language-manager.svelte';
  import type { Snippet } from 'svelte';
  import { quintOut } from 'svelte/easing';
  import { slide } from 'svelte/transition';

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

  const swap = (direction: string) => (direction === 'left' ? 'right' : 'left');

  const layoutDirection = $derived(languageManager.rtl ? swap(direction) : direction);
  const position = $derived.by(() => {
    if (!menuElement) {
      return { left: 0, top: 0 };
    }

    const rect = menuElement.getBoundingClientRect();
    const directionWidth = layoutDirection === 'left' ? rect.width : 0;
    const menuHeight = Math.min(menuElement.clientHeight, height) || 0;

    const left = Math.max(8, Math.min(window.innerWidth - rect.width, x - directionWidth));
    const top = Math.max(8, Math.min(window.innerHeight - menuHeight, y));

    return { left, top };
  });

  // We need to bind clientHeight since the bounding box may return a height
  // of zero when starting the 'slide' animation.
  let height: number = $state(0);

  let isTransitioned = $state(false);
</script>

<div
  bind:clientHeight={height}
  class="fixed min-w-50 w-max max-w-75 overflow-hidden rounded-lg shadow-lg z-1"
  style:left="{position.left}px"
  style:top="{position.top}px"
  transition:slide={{ duration: 250, easing: quintOut }}
  use:clickOutside={{ onOutclick: onClose }}
  onintroend={() => {
    isTransitioned = true;
  }}
  onoutrostart={() => {
    isTransitioned = false;
  }}
>
  <ul
    {id}
    aria-activedescendant={ariaActiveDescendant ?? ''}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy}
    bind:this={menuElement}
    class="{isVisible
      ? 'max-h-dvh'
      : 'max-h-0'} flex flex-col transition-all duration-250 ease-in-out outline-none {isTransitioned
      ? 'overflow-auto'
      : ''}"
    role="menu"
    tabindex="-1"
  >
    {@render children?.()}
  </ul>
</div>
