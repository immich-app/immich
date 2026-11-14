<script lang="ts">
  import { clickOutside } from '#lib/actions/click-outside.ts';
  import { focusTrap } from '#lib/actions/focus-trap.ts';
  import { menuButtonId } from '#lib/components/shared-components/navigation-bar/NavigationBar.svelte';
  import { mediaQueryManager } from '#lib/stores/media-query-manager.svelte.ts';
  import { sidebarStore } from '#lib/stores/sidebar.svelte.ts';
  import { onMount, type Snippet } from 'svelte';

  interface Props {
    ariaLabel?: string;
    children?: Snippet;
  }

  let { ariaLabel, children }: Props = $props();

  const isHidden = $derived(!sidebarStore.isOpen && !mediaQueryManager.isFullSidebar);
  const isExpanded = $derived(sidebarStore.isOpen && !mediaQueryManager.isFullSidebar);

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

<nav
  id="sidebar"
  aria-label={ariaLabel}
  tabindex="-1"
  class="relative z-1 w-0 immich-scrollbar overflow-x-hidden overflow-y-auto bg-light pt-8 transition-all duration-200 sidebar:w-64"
  class:shadow-2xl={isExpanded}
  class:dark:border-e-immich-dark-gray={isExpanded}
  class:border-r={isExpanded}
  class:w-[min(100vw,16rem)]={sidebarStore.isOpen}
  data-testid="sidebar-parent"
  inert={isHidden}
  {@attach clickOutside({ onOutclick: closeSidebar, onEscape: isExpanded ? closeSidebar : undefined })}
  {@attach focusTrap({ active: isExpanded })}
>
  <div class="flex h-max min-h-full flex-col gap-1 pe-6">
    {@render children?.()}
  </div>
</nav>

<style>
  #sidebar {
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    background: rgba(245, 245, 247, 0.65);
    border-color: rgba(0, 0, 0, 0.08);
  }

  html.dark #sidebar {
    background: rgba(15, 15, 17, 0.65);
    border-color: rgba(255, 255, 255, 0.08);
  }
</style>