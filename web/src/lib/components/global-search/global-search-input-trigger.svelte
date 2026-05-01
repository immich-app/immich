<script lang="ts">
  import { page } from '$app/state';
  import SearchSortDropdown from '$lib/components/filter-panel/search-sort-dropdown.svelte';
  import GlobalSearch from '$lib/components/global-search/global-search.svelte';
  import { globalSearchManager } from '$lib/managers/global-search-manager.svelte';
  import { mediaQueryManager } from '$lib/stores/media-query-manager.svelte';
  import { getSearchablePageState } from '$lib/utils/searchable-page-search';

  const searchablePageState = $derived(getSearchablePageState(page.url));
  const showSearchSortControl = $derived(searchablePageState.isSearchable);
</script>

<div class="flex items-center gap-2">
  <GlobalSearch manager={globalSearchManager} variant="dropdown" />

  {#if showSearchSortControl}
    <div class="shrink-0">
      <SearchSortDropdown
        sortOrder={searchablePageState.sortOrder}
        compact={!mediaQueryManager.minLg}
        showRelevance={searchablePageState.query.length > 0}
        onSelect={(mode) => {
          void globalSearchManager.applySearchSort(mode, searchablePageState.query);
        }}
      />
    </div>
  {/if}
</div>
