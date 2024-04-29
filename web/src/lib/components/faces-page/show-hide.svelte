<script lang="ts">
  import { fly } from 'svelte/transition';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import { quintOut } from 'svelte/easing';
  import { createEventDispatcher } from 'svelte';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { mdiClose, mdiEye, mdiEyeOff, mdiRestart } from '@mdi/js';
  import { locale } from '$lib/stores/preferences.store';
  import Button from '$lib/components/elements/buttons/button.svelte';

  const dispatch = createEventDispatcher<{
    close: void;
    reset: void;
    change: void;
    done: void;
  }>();

  export let showLoadingSpinner: boolean;
  export let toggleVisibility: boolean;
  export let screenHeight: number;
  export let countTotalPeople: number;
</script>

<section
  transition:fly={{ y: screenHeight, duration: 150, easing: quintOut, opacity: 1 }}
  class="absolute left-0 top-0 z-[9999] h-full w-full bg-immich-bg dark:bg-immich-dark-bg"
>
  <div
    class="fixed top-0 z-10 flex h-16 w-full items-center justify-between border-b bg-white p-1 dark:border-immich-dark-gray dark:bg-black dark:text-immich-dark-fg md:p-8"
  >
    <div class="flex items-center">
      <CircleIconButton title="Close" icon={mdiClose} on:click={() => dispatch('close')} />
      <div class="flex gap-2 items-center">
        <p class="ml-2">Show & hide people</p>
        <p class="text-sm text-gray-400 dark:text-gray-600">({countTotalPeople.toLocaleString($locale)})</p>
      </div>
    </div>
    <div class="flex items-center justify-end">
      <div class="flex items-center md:mr-8">
        <CircleIconButton title="Reset people visibility" icon={mdiRestart} on:click={() => dispatch('reset')} />
        <CircleIconButton
          title="Toggle visibility"
          icon={toggleVisibility ? mdiEye : mdiEyeOff}
          on:click={() => dispatch('change')}
        />
      </div>
      {#if !showLoadingSpinner}
        <Button on:click={() => dispatch('done')} size="sm" rounded="lg">Done</Button>
      {:else}
        <LoadingSpinner />
      {/if}
    </div>
  </div>

  <div class="flex flex-wrap gap-1 bg-immich-bg p-2 pb-8 dark:bg-immich-dark-bg md:px-8 mt-16">
    <slot />
  </div>
</section>
