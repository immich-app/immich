<script lang="ts">
  import { mdiClose, mdiMagnify } from '@mdi/js';
  import Icon from './icon.svelte';
  import { createEventDispatcher, onMount } from 'svelte';
  import type { SearchOptions } from '$lib/utils/dipatch';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';

  export let name: string;
  export let roundedBottom = true;
  export let isSearching: boolean;
  export let placeholder: string;
  export let focus = false;

  let input: HTMLInputElement;

  const dispatch = createEventDispatcher<{ search: SearchOptions; reset: void }>();

  const resetSearch = () => {
    name = '';
    dispatch('reset');
  };

  onMount(() => {
    if (focus) {
      input.focus();
    }
  });
</script>

<div
  class="flex items-center text-sm {roundedBottom
    ? 'rounded-2xl'
    : 'rounded-t-lg'} bg-gray-200 p-2 dark:bg-immich-dark-gray gap-2 place-items-center h-full"
>
  <button type="button" on:click={() => dispatch('search', { force: true })}>
    <div class="w-fit">
      <Icon path={mdiMagnify} size="24" />
    </div>
  </button>
  <form on:submit|preventDefault class="w-full">
    <input
      bind:this={input}
      class="w-full bg-gray-200 dark:bg-immich-dark-gray dark:text-white"
      type="text"
      {placeholder}
      bind:value={name}
      on:blur
      on:input={() => dispatch('search', { force: false })}
    />
  </form>
  {#if isSearching}
    <div class="flex place-items-center">
      <LoadingSpinner />
    </div>
  {/if}
  {#if name}
    <button on:click={resetSearch} class="mr-1">
      <Icon path={mdiClose} />
    </button>
  {/if}
</div>
