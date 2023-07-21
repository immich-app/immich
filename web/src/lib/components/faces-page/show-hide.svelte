<script lang="ts">
  import { fly } from 'svelte/transition';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import { quintOut } from 'svelte/easing';
  import Close from 'svelte-material-icons/Close.svelte';
  import IconButton from '../elements/buttons/icon-button.svelte';
  import { createEventDispatcher } from 'svelte';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import Restart from 'svelte-material-icons/Restart.svelte';
  import Eye from 'svelte-material-icons/Eye.svelte';
  import EyeOff from 'svelte-material-icons/EyeOff.svelte';

  const dispatch = createEventDispatcher();

  export let showLoadingSpinner: boolean;
  export let toggleVisibility: boolean;
</script>

<section
  transition:fly={{ y: 500, duration: 100, easing: quintOut }}
  class="absolute left-0 top-0 z-[9999] h-full w-full bg-immich-bg dark:bg-immich-dark-bg"
>
  <div
    class="absolute flex h-16 w-full place-items-center justify-between border-b dark:border-immich-dark-gray dark:text-immich-dark-fg"
  >
    <div class="flex w-full items-center justify-between p-8">
      <div class="flex items-center">
        <CircleIconButton logo={Close} on:click={() => dispatch('closeClick')} />
        <p class="ml-4">Show & hide faces</p>
      </div>
      <div class="flex items-center justify-end">
        <div class="mr-8 flex items-center">
          <CircleIconButton
            title="Reset faces visibility"
            logo={Restart}
            on:click={() => dispatch('reset-visibility')}
          />
          <CircleIconButton
            title="Toggle visibility"
            logo={toggleVisibility ? Eye : EyeOff}
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
    <div class="immich-scrollbar absolute top-16 bg-immich-bg p-4 pb-8 dark:bg-immich-dark-bg">
      <slot />
    </div>
  </div>
</section>
