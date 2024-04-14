<script lang="ts">
  import { isSideBarOpen, isSideBarHovered } from '$lib/stores/side-bar.store';
  import { clickOutside, type OutClickEvent } from '$lib/utils/click-outside';
  import { md, lg } from '$lib/utils/media-breakpoint';
  import { onMount, tick } from 'svelte';

  enum SideBarState {
    Closed,
    Small,
    Open,
  }

  let minimalState = SideBarState.Closed;
  let sideBar: HTMLElement;
  let sideBarClasses: string = '';

  // We do not want to risk handling hover events on touch screen since we may
  // get stuck in that state
  let isTouchScreen = false;

  $: if (sideBar) {
    if (minimalState === SideBarState.Open) {
      // Forced Open
      sideBarClasses = 'open w-64 pr-6';
    } else if (($isSideBarHovered && minimalState === SideBarState.Small) || $isSideBarOpen) {
      // Open
      sideBarClasses = 'open sm w-64 pr-6 shadow-2xl border-r dark:border-r-immich-dark-gray';
    } else if (minimalState === SideBarState.Small) {
      // Small
      sideBarClasses = 'closed sm w-18 border-r dark:border-r-immich-dark-gray';
    } else {
      // Closed
      sideBarClasses = 'closed w-0';
    }
  }

  const findElementsFromPoint = (event: OutClickEvent): Element[] => {
    if ('clientX' in event) {
      // MouseEvent
      return document.elementsFromPoint(event.x, event.y);
    } else if ('touches' in event && event.touches.length > 0) {
      // TouchEvent
      const { clientX, clientY } = event.touches[0];
      return document.elementsFromPoint(clientX, clientY);
    } else {
      return [];
    }
  };

  const isHoverToggleButon = (event: OutClickEvent) => {
    const elements = findElementsFromPoint(event);
    return elements.some(({ id }) => id === 'sidebar-toggle-button');
  };

  const onClickOutside = (event: OutClickEvent) => {
    if (minimalState !== SideBarState.Open && !isHoverToggleButon(event)) {
      $isSideBarOpen = false;
    }
  };

  const setTouchScreen = () => {
    isTouchScreen = true;
    $isSideBarHovered = false;
  };

  const setHoverState = (isHover: boolean) => {
    if (!isTouchScreen) {
      $isSideBarHovered = isHover;
    }
  };

  onMount(async () => {
    await tick();
    $isSideBarOpen = false;
  });
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<section
  id="sidebar"
  tabindex="-1"
  bind:this={sideBar}
  use:clickOutside
  on:outclick={({ detail }) => onClickOutside(detail)}
  on:touchstart={() => setTouchScreen()}
  on:mouseenter={() => setHoverState(true)}
  on:mouseleave={() => setHoverState(false)}
  use:md={{
    match: () => (minimalState = SideBarState.Small),
    unmatch: () => (minimalState = SideBarState.Closed),
  }}
  use:lg={{
    match: () => (minimalState = SideBarState.Open),
    unmatch: () => (minimalState = SideBarState.Small),
  }}
  class="immich-scrollbar group relative z-10 flex {sideBarClasses} transition-[width,box-shadow,padding] duration-200 overflow-y-auto overflow-x-hidden bg-immich-bg dark:bg-immich-dark-bg"
>
  <div class="flex min-w-64 pr-6 overflow-x-hidden flex-col gap-1 pt-8">
    <slot />
  </div>
</section>
