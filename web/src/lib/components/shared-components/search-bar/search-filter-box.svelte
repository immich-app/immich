<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { savedSearchTerms } from '$lib/stores/search.store';
  import { mdiMagnify, mdiClose } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import { fly } from 'svelte/transition';

  const dispatch = createEventDispatcher<{
    selectSearchTerm: string;
    clearSearchTerm: string;
    clearAllSearchTerms: void;
  }>();
</script>

<div
  transition:fly={{ y: 25, duration: 250 }}
  class="absolute w-full rounded-b-3xl border border-gray-200 bg-white pb-5 shadow-2xl transition-all dark:border-gray-800 dark:bg-immich-dark-gray dark:text-gray-300 p-6"
>
  <p>FILTERS</p>
  <hr />

  <form>
    <div class="flex py-3">
      <label for="subject">Subject</label>
      <input type="text" id="subject" name="subjet" />
    </div>
  </form>
</div>
