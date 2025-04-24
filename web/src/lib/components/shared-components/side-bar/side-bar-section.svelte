<script lang="ts">
  import { clickOutside } from '$lib/actions/click-outside';
  import { focusTrap } from '$lib/actions/focus-trap';
  import { menuButtonId } from '$lib/components/shared-components/navigation-bar/navigation-bar.svelte';
  import { mobileDevice } from '$lib/stores/mobile-device.svelte';
  import { sidebarStore } from '$lib/stores/sidebar.svelte';
  import { onMount, type Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  const isHidden = $derived(!sidebarStore.isOpen && !mobileDevice.isFullSidebar);
  const isExpanded = $derived(sidebarStore.isOpen && !mobileDevice.isFullSidebar);

  onMount(() => {
    closeSidebar();
  });

  const closeSidebar = () => {
    if (!isExpanded) {
      return;
    }
    sidebarStore.reset();
    if (isHidden) {
      document.querySelector<HTMLButtonElement>(`#${menuButtonId}`)?.focus();
    }
  };
</script>

<section
  id="sidebar"
  tabindex="-1"
  class="immich-scrollbar relative z-10 w-0 sidebar:w-[16rem] overflow-y-auto overflow-x-hidden bg-immich-bg pt-8 transition-all duration-200 dark:bg-immich-dark-bg"
  class:shadow-2xl={isExpanded}
  class:dark:border-e-immich-dark-gray={isExpanded}
  class:border-r={isExpanded}
  class:w-[min(100vw,16rem)]={sidebarStore.isOpen}
  data-testid="sidebar-parent"
  inert={isHidden}
  use:clickOutside={{ onOutclick: closeSidebar, onEscape: closeSidebar }}
  use:focusTrap={{ active: isExpanded }}
>
  <div class="pe-6 flex flex-col gap-1 h-max min-h-full">
    {@render children?.()}
  </div>
</section>
