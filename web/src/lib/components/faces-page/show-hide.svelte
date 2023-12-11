<script lang="ts">
  import { fly } from 'svelte/transition';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import { quintOut } from 'svelte/easing';
  import IconButton from '../elements/buttons/icon-button.svelte';
  import { createEventDispatcher } from 'svelte';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { mdiClose, mdiEye, mdiEyeOff, mdiRestart } from '@mdi/js';

  const dispatch = createEventDispatcher();

  export let showLoadingSpinner: boolean;
  export let toggleVisibility: boolean;
</script>

<section
  transition:fly={{ y: 500, duration: 100, easing: quintOut }}
  class="absolute left-0 top-0 z-[9999] h-full w-full bg-immich-bg dark:bg-immich-dark-bg"
>
  <div
    class="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b bg-white p-1 dark:border-immich-dark-gray dark:bg-black dark:text-immich-dark-fg md:p-8"
  >
    <div class="flex items-center">
      <CircleIconButton icon={mdiClose} on:click={() => dispatch('closeClick')} />
      <p class="ml-4 hidden sm:block">Show & hide people</p>
    </div>
    <div class="flex items-center justify-end">
      <div class="flex items-center md:mr-8">
        <CircleIconButton
          title="Reset people visibility"
          icon={mdiRestart}
          on:click={() => dispatch('reset-visibility')}
        />
        <CircleIconButton
          title="Toggle visibility"
          icon={toggleVisibility ? mdiEye : mdiEyeOff}
          on:click={() => dispatch('toggle-visibility')}
        />
      </div>
      {#if !showLoadingSpinner}
        <IconButton on:click={() => dispatch('doneClick')}>Done</IconButton>
      {:else}
        <LoadingSpinner />
      {/if}
    </div>
  </div>

  <div class="flex w-full flex-wrap gap-1 bg-immich-bg p-2 pb-8 dark:bg-immich-dark-bg md:px-8 md:pt-4">
    <slot />
  </div>
</section>
