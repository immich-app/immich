<script lang="ts">
  import { focusOutside } from '$lib/actions/focus-outside';
  import { shortcuts } from '$lib/actions/shortcut';
  import ImmichLogo from '$lib/components/shared-components/immich-logo.svelte';
  import { menuButtonId } from '$lib/components/shared-components/navigation-bar/navigation-bar.svelte';
  import { AppRoute } from '$lib/constants';
  import { isOpen } from '$lib/stores/side-bar.store';
  import { onMount, type Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
    peek?: boolean;
  }

  const smBreakpoint = 640;
  const mdBreakpoint = 768;

  let { children, peek = false }: Props = $props();

  let innerWidth: number = $state(0);

  onMount(() => {
    closeSidebar();
  });

  const closeSidebar = () => {
    $isOpen = window.innerWidth >= mdBreakpoint ? true : false;
  };

  let isHidden = $derived(!$isOpen && (innerWidth < smBreakpoint || (innerWidth < mdBreakpoint && !peek)));

  const handleEscape = () => {
    closeSidebar();
    if (isHidden) {
      document.querySelector<HTMLButtonElement>(`#${menuButtonId}`)?.focus();
    }
  };
</script>

<svelte:window onresize={closeSidebar} bind:innerWidth />
<!-- svelte-ignore a11y_no_static_element_interactions -->
<section
  id="sidebar"
  tabindex="-1"
  class="immich-scrollbar group relative z-10 flex w-0 flex-col gap-1 overflow-y-auto overflow-x-hidden bg-immich-bg sm:pt-8 transition-all duration-200 dark:bg-immich-dark-bg hover:sm:pr-6 md:w-64 md:pr-6 hover:md:shadow-none"
  class:shadow-2xl={$isOpen}
  class:dark:border-r-immich-dark-gray={$isOpen}
  class:border-r={$isOpen}
  class:pr-6={$isOpen}
  class:sm:w-18={!$isOpen && peek}
  class:w-64={$isOpen}
  inert={isHidden}
  onmouseenter={() => ($isOpen = true)}
  onmouseleave={closeSidebar}
  onfocusin={() => ($isOpen = true)}
  use:focusOutside={{ onFocusOut: closeSidebar }}
  use:shortcuts={[
    {
      shortcut: { key: 'Escape' },
      onShortcut: handleEscape,
    },
  ]}
>
  <a class="ml-4 sm:hidden my-4" href={AppRoute.PHOTOS}>
    <ImmichLogo width="120em" class="max-w-none" />
  </a>
  {@render children?.()}
</section>
