<script lang="ts" module>
  export interface SearchDateFilter {
    takenBefore?: DateTime;
    takenAfter?: DateTime;
  }
</script>

<script lang="ts">
  import { DatePicker, Text } from '@immich/ui';
  import type { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  interface Props {
    filters: SearchDateFilter;
  }

  let { filters = $bindable() }: Props = $props();

  let invalid = $derived(filters.takenAfter && filters.takenBefore && filters.takenAfter > filters.takenBefore);
</script>

<div class="flex flex-col gap-1">
  <div id="date-range-selection" class="grid grid-auto-fit-40 gap-5">
    <div>
      <Text class="mb-2" fontWeight="medium">{$t('start_date')}</Text>
      <DatePicker bind:value={filters.takenAfter} />
    </div>

    <div>
      <Text class="mb-2" fontWeight="medium">{$t('end_date')}</Text>
      <DatePicker bind:value={filters.takenBefore} />
    </div>
  </div>
  {#if invalid}
    <Text color="danger">{$t('start_date_before_end_date')}</Text>
  {/if}
</div>
