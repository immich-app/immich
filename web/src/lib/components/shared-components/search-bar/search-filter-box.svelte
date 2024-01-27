<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
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
  <p class="text-xs py-2">FILTERS</p>
  <hr class="py-2" />

  <form>
    <div class="py-3">
      <label class="immich-form-label" for="context">CONTEXT</label>
      <input
        class="immich-form-input w-full border border-gray-300 dark:border-gray-500"
        type="text"
        id="context"
        name="context"
        placeholder="Sunrise on the beach"
      />
    </div>

    <div class="py-3">
      <label class="immich-form-label" for="place">PLACE</label>
      <input
        class="immich-form-input w-full border border-gray-300 dark:border-gray-500"
        type="text"
        id="place"
        name="place"
      />
    </div>

    <div class="flex justify-between gap-5">
      <div class="py-3 flex-1">
        <label class="immich-form-label" for="start-date">START DATE</label>
        <input
          class="immich-form-input w-full border border-gray-300 dark:border-gray-500"
          type="date"
          id="start-date"
          name="start-date"
        />
      </div>

      <div class="py-3 flex-1">
        <label class="immich-form-label" for="end-date">END DATE</label>
        <input
          class="immich-form-input w-full border border-gray-300 dark:border-gray-500"
          type="date"
          id="end-date"
          name="end-date"
          placeholder=""
        />
      </div>
    </div>

    <div id="button-row" class="flex justify-end gap-4 mt-5">
      <Button color="gray">CLEAR ALL</Button>
      <Button type="submit">SEARCH</Button>
    </div>
  </form>
</div>
