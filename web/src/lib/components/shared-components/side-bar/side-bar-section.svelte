<script lang="ts">
  import { clickOutside } from '$lib/actions/click-outside';
  import { focusTrap } from '$lib/actions/focus-trap';
  import { menuButtonId } from '$lib/components/shared-components/navigation-bar/navigation-bar.svelte';
  import { isSidebarOpen } from '$lib/stores/side-bar.svelte';
  import { onMount, type Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  const mdBreakpoint = 768;

  let { children }: Props = $props();

  let innerWidth: number = $state(0);

  onMount(() => {
    closeSidebar(innerWidth);
  });

  const closeSidebar = (width: number) => {
    isSidebarOpen.value = width >= mdBreakpoint ? true : false;
  };

  $effect(() => {
    closeSidebar(innerWidth);
  });

  const isHidden = $derived(!isSidebarOpen.value && innerWidth < mdBreakpoint);
  const isExpanded = $derived(isSidebarOpen.value && innerWidth < mdBreakpoint);

  const handleClickOutside = () => {
    if (!isSidebarOpen.value) {
      return;
    }
    closeSidebar(innerWidth);
    if (isHidden) {
      document.querySelector<HTMLButtonElement>(`#${menuButtonId}`)?.focus();
    }
  };
</script>

<svelte:window bind:innerWidth />
<section
  id="sidebar"
  tabindex="-1"
  class="immich-scrollbar group relative z-10 flex w-0 flex-col gap-1 overflow-y-auto overflow-x-hidden bg-immich-bg pt-8 transition-all duration-200 dark:bg-immich-dark-bg pr-6"
  class:shadow-2xl={isExpanded}
  class:dark:border-r-immich-dark-gray={isExpanded}
  class:border-r={isExpanded}
  class:pr-6={isSidebarOpen.value}
  class:w-[min(100vw,16rem)]={isSidebarOpen.value}
  inert={isHidden}
  use:clickOutside={{ onOutclick: handleClickOutside, onEscape: handleClickOutside }}
  use:focusTrap={{ active: isExpanded }}
>
  {@render children?.()}
</section>
