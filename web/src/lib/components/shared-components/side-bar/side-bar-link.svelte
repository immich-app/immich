<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiChevronDown, mdiChevronLeft } from '@mdi/js';
  import { resolveRoute } from '$app/paths';
  import { page } from '$app/state';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    title: string;
    routeId: string;
    icon: string;
    flippedLogo?: boolean;
    isSelected?: boolean;
    preloadData?: boolean;
    dropDownContent?: Snippet;
    dropdownOpen?: boolean;
  }

  let {
    title,
    routeId,
    icon,
    flippedLogo = false,
    isSelected = $bindable(false),
    preloadData = true,
    dropDownContent: hasDropdown,
    dropdownOpen = $bindable(false),
  }: Props = $props();

  let routePath = $derived(resolveRoute(routeId, {}));

  $effect(() => {
    isSelected = (page.route.id?.match(/^\/(admin|\(user\))\/[^/]*/) || [])[0] === routeId;
  });
</script>

<div class="relative">
  {#if hasDropdown}
    <span class="hidden md:block absolute start-1 z-50 h-full">
      <button
        type="button"
        aria-label={$t('recent-albums')}
        class="relative flex cursor-default pt-4 pb-4 select-none justify-center hover:cursor-pointer hover:bg-immich-gray hover:fill-gray hover:text-immich-primary dark:text-immich-dark-fg dark:hover:bg-immich-dark-gray dark:hover:text-immich-dark-primary rounded h-fill"
        onclick={() => (dropdownOpen = !dropdownOpen)}
      >
        <Icon
          path={dropdownOpen ? mdiChevronDown : mdiChevronLeft}
          size="1em"
          class="shrink-0 delay-100 duration-100 "
          flipped={flippedLogo}
          ariaHidden
        />
      </button>
    </span>
  {/if}
  <a
    href={routePath}
    data-sveltekit-preload-data={preloadData ? 'hover' : 'off'}
    draggable="false"
    aria-current={isSelected ? 'page' : undefined}
    class="flex w-full place-items-center gap-4 rounded-e-full py-3 transition-[padding] delay-100 duration-100 hover:cursor-pointer hover:bg-immich-gray hover:text-immich-primary dark:text-immich-dark-fg dark:hover:bg-immich-dark-gray dark:hover:text-immich-dark-primary
    {isSelected
      ? 'bg-immich-primary/10 text-immich-primary hover:bg-immich-primary/10 dark:bg-immich-dark-primary/10 dark:text-immich-dark-primary'
      : ''}"
  >
    <div class="flex w-full place-items-center gap-4 ps-5 overflow-hidden truncate">
      <Icon path={icon} size="1.5em" class="shrink-0" flipped={flippedLogo} ariaHidden />
      <span class="text-sm font-medium">{title}</span>
    </div>
    <div></div>
  </a>
</div>

{#if hasDropdown && dropdownOpen}
  {@render hasDropdown?.()}
{/if}
