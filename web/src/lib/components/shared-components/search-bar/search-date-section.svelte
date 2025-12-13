<script lang="ts" module>
  export interface SearchDateFilter {
    takenBefore?: string;
    takenAfter?: string;
  }
</script>

<script lang="ts">
  import DateInput from '$lib/elements/DateInput.svelte';
  import { Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    filters: SearchDateFilter;
  }

  let { filters = $bindable() }: Props = $props();

  let invalid = $derived(filters.takenAfter && filters.takenBefore && filters.takenAfter > filters.takenBefore);

  const inputClasses = $derived(
    `immich-form-input w-full mt-1 hover:cursor-pointer ${invalid ? 'border border-danger' : ''}`,
  );
</script>

<div class="flex flex-col gap-1">
  <div id="date-range-selection" class="grid grid-auto-fit-40 gap-5">
    <label class="immich-form-label" for="start-date">
      <span class="uppercase">{$t('start_date')}</span>
      <DateInput class={inputClasses} type="date" id="start-date" name="start-date" bind:value={filters.takenAfter} />
    </label>

    <label class="immich-form-label" for="end-date">
      <span class="uppercase">{$t('end_date')}</span>
      <DateInput class={inputClasses} type="date" id="end-date" name="end-date" bind:value={filters.takenBefore} />
    </label>
  </div>
  {#if invalid}
    <Text color="danger">{$t('start_date_before_end_date')}</Text>
  {/if}
</div>
