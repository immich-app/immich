<script lang="ts">
  import { getSearchDatePreset, SearchDatePreset } from './search-bar-utils';
  import { DatePicker, Text } from '@immich/ui';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';
  import { searchManager } from '$lib/managers/search-manager.svelte';
  import SearchButton from './SearchButton.svelte';

  let filters = $derived(searchManager.filter.date);
  let invalid = $derived(filters.takenAfter && filters.takenBefore && filters.takenAfter > filters.takenBefore);

  let currentPreset = $derived(getSearchDatePreset(filters.takenAfter, filters.takenBefore));

  const setPreset = (preset: SearchDatePreset) => {
    if (currentPreset === preset) {
      currentPreset = filters.takenAfter = filters.takenBefore = undefined;
      return;
    }

    switch (preset) {
      case SearchDatePreset.ThisYear: {
        filters.takenAfter = DateTime.utc().startOf('year');
        filters.takenBefore = DateTime.utc().endOf('year');
        break;
      }
      case SearchDatePreset.LastYear: {
        filters.takenAfter = DateTime.utc().minus({ years: 1 }).startOf('year');
        filters.takenBefore = DateTime.utc().minus({ years: 1 }).endOf('year');
        break;
      }
      case SearchDatePreset.Last30Days: {
        filters.takenAfter = DateTime.utc().minus({ days: 30 }).startOf('day');
        filters.takenBefore = DateTime.utc().endOf('day');
        break;
      }
      case SearchDatePreset.Custom: {
        filters.takenAfter = filters.takenBefore = undefined;
        break;
      }
    }

    currentPreset = preset;
  };
</script>

<div>
  <Text class="pb-5">{$t('search_filter_date_description')}</Text>
  <div class="flex flex-wrap gap-2">
    <SearchButton
      checked
      active={currentPreset === SearchDatePreset.ThisYear}
      onclick={() => setPreset(SearchDatePreset.ThisYear)}>{$t('search_filter_date_this_year')}</SearchButton
    >
    <SearchButton
      checked
      active={currentPreset === SearchDatePreset.LastYear}
      onclick={() => setPreset(SearchDatePreset.LastYear)}>{$t('search_filter_date_last_year')}</SearchButton
    >
    <SearchButton
      checked
      active={currentPreset === SearchDatePreset.Last30Days}
      onclick={() => setPreset(SearchDatePreset.Last30Days)}>{$t('search_filter_date_last_30_days')}</SearchButton
    >
    <SearchButton
      checked
      active={currentPreset === SearchDatePreset.Custom}
      onclick={() => setPreset(SearchDatePreset.Custom)}>{$t('search_filter_date_custom')}</SearchButton
    >
  </div>
  {#if currentPreset === SearchDatePreset.Custom}
    <div id="date-range-selection" class="grid grid-auto-fit-40 gap-5 py-5">
      <div>
        <Text class="mb-2" fontWeight="medium">{$t('start_date')}</Text>
        <DatePicker bind:value={filters.takenAfter} />
      </div>
      <div>
        <Text class="mb-2" fontWeight="medium">{$t('end_date')}</Text>
        <DatePicker bind:value={filters.takenBefore} />
      </div>
    </div>
  {/if}
  {#if invalid}
    <Text color="danger">{$t('start_date_before_end_date')}</Text>
  {/if}
</div>
