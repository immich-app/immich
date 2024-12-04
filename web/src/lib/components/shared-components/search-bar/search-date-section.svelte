<script lang="ts" module>
  export interface SearchDateFilter {
    takenBefore?: string;
    takenAfter?: string;
  }
</script>

<script lang="ts">
  import DateInput from '$lib/components/elements/date-input.svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    filters: SearchDateFilter;
  }

  let { filters = $bindable() }: Props = $props();
</script>

<div id="date-range-selection" class="grid grid-auto-fit-40 gap-5">
  <label class="immich-form-label" for="start-date">
    <span>{$t('start_date').toUpperCase()}</span>
    <DateInput
      class="immich-form-input w-full mt-1 hover:cursor-pointer"
      type="date"
      id="start-date"
      name="start-date"
      max={filters.takenBefore}
      bind:value={filters.takenAfter}
    />
  </label>

  <label class="immich-form-label" for="end-date">
    <span>{$t('end_date').toUpperCase()}</span>
    <DateInput
      class="immich-form-input w-full mt-1 hover:cursor-pointer"
      type="date"
      id="end-date"
      name="end-date"
      placeholder=""
      min={filters.takenAfter}
      bind:value={filters.takenBefore}
    />
  </label>
</div>
