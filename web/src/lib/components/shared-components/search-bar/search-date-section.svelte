<script lang="ts">
  import type { SearchFilter } from './search-filter-box.svelte';

  export let filteredDate: SearchFilter['date'];
</script>

<div id="date-range-selection" class="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-5">
  <label class="immich-form-label" for="start-date">
    <span>START DATE</span>
    <input
      class="immich-form-input w-full mt-1 hover:cursor-pointer"
      type="date"
      id="start-date"
      name="start-date"
      max={filteredDate.takenBefore}
      bind:value={filteredDate.takenAfter}
    />
  </label>

  <label class="immich-form-label" for="end-date">
    <span>END DATE</span>
    <input
      class="immich-form-input w-full mt-1 hover:cursor-pointer"
      type="date"
      id="end-date"
      name="end-date"
      placeholder=""
      min={filteredDate.takenAfter}
      bind:value={filteredDate.takenBefore}
    />
  </label>
</div>
