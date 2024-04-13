<script lang="ts">
  import { fade } from 'svelte/transition';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiInformationOutline } from '@mdi/js';
  import { resolveRoute } from '$app/paths';
  import { page } from '$app/stores';

  export let title: string;
  export let routeId: string;
  export let icon: string;
  export let flippedLogo = false;
  export let isSelected = false;
  export let preloadData = true;

  let showMoreInformation = false;

  $: routePath = resolveRoute(routeId, {});
  $: isSelected = ($page.route.id?.match(/^\/(admin|\(user\))\/[^/]*/) || [])[0] === routeId;

  // <a> (the button itself) additional classes
  $: linkClasses = isSelected ? 'text-immich-primary' : '';

  // Underlay (first <div>, used as background color) additional classes
  $: underlayClasses = isSelected
    ? 'bg-immich-primary/10 group-hover/navitem:bg-immich-primary/25 dark:bg-immich-dark-primary/10 dark:text-immich-dark-primary'
    : '';
</script>

<a
  href={routePath}
  data-sveltekit-preload-data={preloadData ? 'hover' : 'off'}
  draggable="false"
  aria-current={isSelected ? 'page' : undefined}
  class="relative group/navitem flex gap-4 px-5 py-3 w-full place-items-center justify-between rounded-r-full
  transition-all duration-200 hover:cursor-pointer hover:text-immich-primary dark:text-immich-dark-fg
  dark:hover:text-immich-dark-primary group-[.sm.closed]:ml-1 {linkClasses}"
>
  <div
    class="absolute inset-0 w-full rounded-r-full transition-all duration-200 group-hover/navitem:bg-immich-gray
    dark:group-hover/navitem:bg-immich-dark-gray group-[.sm.closed]:w-14 group-[.sm.closed]:rounded-full
    group-[.sm.closed]:ml-1 {underlayClasses}"
  />

  <div class="relative flex w-full place-items-center gap-4 overflow-hidden truncate">
    <Icon path={icon} size="1.5em" class="shrink-0" flipped={flippedLogo} ariaHidden />
    <span class="text-sm font-medium group-[.sm.closed]:opacity-0 transition-opacity duration-200">{title}</span>
  </div>

  <div class="relative h-auto overflow-visible">
    {#if $$slots.moreInformation}
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="relative z-10 flex cursor-default select-none justify-center"
        on:mouseenter={() => (showMoreInformation = true)}
        on:mouseleave={() => (showMoreInformation = false)}
      >
        <div class="p-1 text-gray-600 hover:cursor-help dark:text-gray-400">
          <Icon path={mdiInformationOutline} />
        </div>

        {#if showMoreInformation}
          <div class="absolute right-6 top-0">
            <div
              class="flex place-content-center place-items-center whitespace-nowrap rounded-3xl border bg-immich-bg px-6 py-3 text-xs text-immich-fg shadow-lg dark:border-immich-dark-gray dark:bg-gray-600 dark:text-immich-dark-fg"
              class:hidden={!showMoreInformation}
              transition:fade={{ duration: 200 }}
            >
              <slot name="moreInformation" />
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</a>
