<script lang="ts">
  import { mdiClose, mdiMagnify } from '@mdi/js';
  import Icon from './icon.svelte';
  import { createEventDispatcher } from 'svelte';
  import type { SearchOptions } from '$lib/utils/dipatch';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';

  export let name: string;
  export let roundedBottom = true;
  export let isSearching: boolean;
  export let placeholder: string;

  const dispatch = createEventDispatcher<{ search: SearchOptions; reset: void }>();

  const resetSearch = () => {
    name = '';
    dispatch('reset');
  };
</script>

<div
  class="flex items-center text-sm {roundedBottom
    ? 'rounded-lg'
    : 'rounded-t-lg'} bg-gray-100 p-2 dark:bg-gray-700 gap-2 place-items-center h-full"
>
  <button on:click={() => dispatch('search', { force: true })}>
    <div class="w-fit">
      <Icon path={mdiMagnify} size="24" />
    </div>
  </button>
  <!-- svelte-ignore a11y-autofocus -->
  <input
    autofocus
    class="w-full gap-2 bg-gray-100 dark:bg-gray-700 dark:text-white"
    type="text"
    {placeholder}
    bind:value={name}
    on:input={() => dispatch('search', { force: false })}
  />
  {#if isSearching}
    <div class="flex place-items-center">
      <LoadingSpinner />
    </div>
  {/if}
  {#if name}
    <button on:click={resetSearch}>
      <Icon path={mdiClose} />
    </button>
  {/if}
</div>
