<script lang="ts">
  import { page } from '$app/state';
  import { Icon } from '@immich/ui';
  import { mdiChevronDown, mdiChevronLeft } from '@mdi/js';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    title: string;
    href: string;
    icon: string;
    flippedLogo?: boolean;
    isSelected?: boolean;
    preloadData?: boolean;
    dropDownContent?: Snippet;
    dropdownOpen?: boolean;
  }

  let {
    title,
    href,
    icon,
    flippedLogo = false,
    isSelected = $bindable(false),
    preloadData = true,
    dropDownContent: hasDropdown,
    dropdownOpen = $bindable(false),
  }: Props = $props();

  $effect(() => {
    isSelected = page.url.pathname.startsWith(href);
  });
</script>

<div class="relative">
  {#if hasDropdown}
    <span class="hidden md:block absolute start-1 h-full">
      <button
        type="button"
        aria-label={$t('recent-albums')}
        class="relative flex cursor-default pt-4 pb-4 select-none justify-center hover:cursor-pointer hover:bg-subtle hover:fill-gray hover:text-immich-primary dark:text-immich-dark-fg dark:hover:bg-immich-dark-gray dark:hover:text-immich-dark-primary rounded h-fill"
        onclick={() => (dropdownOpen = !dropdownOpen)}
      >
        <Icon
          icon={dropdownOpen ? mdiChevronDown : mdiChevronLeft}
          size="1em"
          class="shrink-0 delay-100 duration-100 "
          flipped={flippedLogo}
          aria-hidden
        />
      </button>
    </span>
  {/if}
  <a
    {href}
    data-sveltekit-preload-data={preloadData ? 'hover' : 'off'}
    draggable="false"
    aria-current={isSelected ? 'page' : undefined}
    class="flex w-full place-items-center gap-4 rounded-e-full py-3 transition-[padding] delay-100 duration-100 hover:cursor-pointer hover:bg-subtle hover:text-immich-primary dark:text-immich-dark-fg dark:hover:bg-immich-dark-gray dark:hover:text-immich-dark-primary
    {isSelected ? 'bg-immich-primary/10 text-primary hover:bg-immich-primary/10 dark:bg-immich-dark-primary/10' : ''}"
  >
    <div class="flex w-full place-items-center gap-4 ps-5 overflow-hidden truncate">
      <Icon {icon} size="1.5em" class="shrink-0" flipped={flippedLogo} aria-hidden />
      <span class="text-sm font-medium">{title}</span>
    </div>
    <div></div>
  </a>
</div>

{#if hasDropdown && dropdownOpen}
  {@render hasDropdown?.()}
{/if}
