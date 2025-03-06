<script lang="ts">
  import { focusTrap } from '$lib/actions/focus-trap';
  import { shortcuts } from '$lib/actions/shortcut';
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
    closeSidebar();
  });

  const closeSidebar = () => {
    isSidebarOpen.value = innerWidth >= mdBreakpoint ? true : false;
  };

  let isHidden = $derived(!isSidebarOpen.value && innerWidth < mdBreakpoint);

  const handleEscape = () => {
    closeSidebar();
    if (isHidden) {
      document.querySelector<HTMLButtonElement>(`#${menuButtonId}`)?.focus();
    }
  };
</script>

<svelte:window onresize={closeSidebar} bind:innerWidth />
<section
  id="sidebar"
  tabindex="-1"
  class="immich-scrollbar group relative z-10 flex w-0 flex-col gap-1 overflow-y-auto overflow-x-hidden bg-immich-bg pt-8 transition-all duration-200 dark:bg-immich-dark-bg md:w-64 pr-6"
  class:shadow-2xl={isSidebarOpen.value && innerWidth < mdBreakpoint}
  class:dark:border-r-immich-dark-gray={isSidebarOpen.value && innerWidth < mdBreakpoint}
  class:border-r={isSidebarOpen.value && innerWidth < mdBreakpoint}
  class:pr-6={isSidebarOpen.value}
  class:w-64={isSidebarOpen.value}
  inert={isHidden}
  onfocusin={() => (isSidebarOpen.value = true)}
  use:focusTrap={{ active: isSidebarOpen.value && innerWidth < mdBreakpoint }}
  use:shortcuts={[
    {
      shortcut: { key: 'Escape' },
      onShortcut: handleEscape,
    },
  ]}
>
  {@render children?.()}
</section>
