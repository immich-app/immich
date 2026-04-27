<script lang="ts">
  import { clickOutside } from '$lib/actions/click-outside';
  import { languageManager } from '$lib/managers/language-manager.svelte';
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
    menuScrollView?: HTMLDivElement | undefined;
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
    menuScrollView = $bindable(),
    menuElement = $bindable(),
    onClose = undefined,
    children,
  }: Props = $props();

  const swap = (direction: string) => (direction === 'left' ? 'right' : 'left');

  const layoutDirection = $derived(languageManager.rtl ? swap(direction) : direction);
  const position = $derived.by(() => {
    if (!menuScrollView || !menuElement) {
      return { left: 0, top: 0 };
    }

    const rect = menuScrollView.getBoundingClientRect();
    const directionWidth = layoutDirection === 'left' ? rect.width : 0;

    const margin = 8;

    const left = Math.max(margin, Math.min(windowInnerWidth - rect.width - margin, x - directionWidth));
    const top = Math.max(margin, Math.min(windowInnerHeight - menuElement.clientHeight, y));
    const maxHeight = windowInnerHeight - top - margin;

    const needScrollBar = menuElement.clientHeight > maxHeight;

    return { left, top, maxHeight, needScrollBar };
  });

  let windowInnerHeight: number = $state(0);
  let windowInnerWidth: number = $state(0);
</script>

<svelte:window bind:innerWidth={windowInnerWidth} bind:innerHeight={windowInnerHeight} />

<div
  bind:this={menuScrollView}
  class={[
    'duration-250 ease-in-out fixed min-w-50 w-max max-w-75 rounded-lg shadow-lg bg-slate-100 z-1 immich-scrollbar',
    position.needScrollBar ? 'overflow-auto' : 'overflow-hidden',
  ]}
  style:left="{position.left}px"
  style:top="{position.top}px"
  style:max-height={isVisible ? `${position.maxHeight}px` : '0px'}
  style:transition-property="max-height"
  style:scrollbar-color="rgba(85, 86, 87, 0.408) transparent"
  use:clickOutside={{ onOutclick: onClose }}
  tabindex="-1"
>
  <ul
    {id}
    aria-activedescendant={ariaActiveDescendant ?? ''}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy}
    bind:this={menuElement}
    class="flex flex-col outline-none"
    role="menu"
    tabindex="-1"
  >
    {@render children?.()}
  </ul>
</div>
