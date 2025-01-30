<script lang="ts">
  import { focusTrap } from '$lib/actions/focus-trap';
  import { shortcuts } from '$lib/actions/shortcut';
  import { menuButtonId } from '$lib/components/shared-components/navigation-bar/navigation-bar.svelte';
  import { isOpen } from '$lib/stores/side-bar.store';
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
    $isOpen = innerWidth >= mdBreakpoint ? true : false;
  };

  let isHidden = $derived(!$isOpen && innerWidth < mdBreakpoint);

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
  class:shadow-2xl={$isOpen && innerWidth < mdBreakpoint}
  class:dark:border-r-immich-dark-gray={$isOpen && innerWidth < mdBreakpoint}
  class:border-r={$isOpen && innerWidth < mdBreakpoint}
  class:pr-6={$isOpen}
  class:w-64={$isOpen}
  inert={isHidden}
  onfocusin={() => ($isOpen = true)}
  use:focusTrap={{ active: $isOpen && innerWidth < mdBreakpoint }}
  use:shortcuts={[
    {
      shortcut: { key: 'Escape' },
      onShortcut: handleEscape,
    },
  ]}
>
  {@render children?.()}
</section>
