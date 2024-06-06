<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { savedSearchTerms } from '$lib/stores/search.store';
  import { mdiMagnify, mdiClose } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import { fly } from 'svelte/transition';
  import { t } from 'svelte-i18n';

  const dispatch = createEventDispatcher<{
    selectSearchTerm: string;
    clearSearchTerm: string;
    clearAllSearchTerms: void;
  }>();
</script>

<div
  transition:fly={{ y: 25, duration: 250 }}
  class="absolute w-full rounded-b-3xl border border-gray-200 bg-white pb-5 shadow-2xl transition-all dark:border-gray-800 dark:bg-immich-dark-gray dark:text-gray-300"
>
  {#if $savedSearchTerms.length > 0}
    <div class="flex items-center justify-between px-5 pt-5 text-xs">
      <p>{$t('recent_searches').toUpperCase()}</p>
      <div class="flex w-18 items-center justify-center">
        <button
          type="button"
          class="rounded-lg p-2 font-semibold text-immich-primary hover:bg-immich-primary/25 dark:text-immich-dark-primary"
          on:click={() => dispatch('clearAllSearchTerms')}>{$t('clear_all')}</button
        >
      </div>
    </div>
  {/if}

  {#each $savedSearchTerms as savedSearchTerm, i (i)}
    <div
      class="flex w-full items-center justify-between text-sm text-black hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-500/10"
    >
      <div class="relative w-full items-center">
        <button
          type="button"
          class="relative flex w-full cursor-pointer gap-3 py-3 pl-5"
          on:click={() => dispatch('selectSearchTerm', savedSearchTerm)}
        >
          <Icon path={mdiMagnify} size="1.5em" />
          {savedSearchTerm}
        </button>
        <div class="absolute right-5 top-0 items-center justify-center py-3">
          <button type="button" on:click={() => dispatch('clearSearchTerm', savedSearchTerm)}
            ><Icon path={mdiClose} size="18" /></button
          >
        </div>
      </div>
    </div>
  {/each}
</div>
