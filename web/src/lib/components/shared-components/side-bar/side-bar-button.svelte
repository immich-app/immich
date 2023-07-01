<script lang="ts">
  import type Icon from 'svelte-material-icons/AbTesting.svelte';
  import InformationOutline from 'svelte-material-icons/InformationOutline.svelte';
  import { fade } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';

  export let title: string;
  export let logo: typeof Icon;
  export let isSelected: boolean;
  export let flippedLogo = false;

  let showMoreInformation = false;

  const dispatch = createEventDispatcher();
  const onButtonClicked = () => dispatch('selected');
</script>

<div
  on:click={onButtonClicked}
  on:keydown={onButtonClicked}
  class="flex gap-4 justify-between place-items-center w-full transition-[padding] delay-100 duration-100 py-3 rounded-r-full hover:bg-immich-gray dark:hover:bg-immich-dark-gray hover:text-immich-primary dark:text-immich-dark-fg dark:hover:text-immich-dark-primary hover:cursor-pointer
    {isSelected
    ? 'bg-immich-primary/10 dark:bg-immich-dark-primary/10 text-immich-primary dark:text-immich-dark-primary hover:bg-immich-primary/25'
    : ''}
		pl-5 group-hover:sm:px-5 md:px-5
  "
>
  <div class="flex gap-4 place-items-center w-full overflow-hidden truncate">
    <svelte:component this={logo} size="1.5em" class="shrink-0 {flippedLogo ? '-scale-x-100' : ''}" />
    <p class="font-medium text-sm">{title}</p>
  </div>

  <div
    class="transition-[height] group-hover:sm:overflow-visible md:overflow-visible overflow-hidden duration-100 delay-1000 sm:group-hover:h-auto md:h-auto h-0"
  >
    {#if $$slots.moreInformation}
      <div
        class="relative flex justify-center select-none cursor-default"
        on:mouseenter={() => (showMoreInformation = true)}
        on:mouseleave={() => (showMoreInformation = false)}
      >
        <div class="hover:cursor-help p-1 text-gray-600 dark:text-gray-400">
          <InformationOutline />
        </div>

        {#if showMoreInformation}
          <div class="absolute right-6 top-0">
            <div
              class="flex place-items-center place-content-center whitespace-nowrap rounded-3xl shadow-lg py-3 px-6 bg-immich-bg text-immich-fg dark:bg-gray-600 dark:text-immich-dark-fg text-xs border dark:border-immich-dark-gray"
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
</div>
