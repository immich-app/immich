<script lang="ts">
  import type { FilterState } from '$lib/components/filter-panel/filter-panel';

  interface Props {
    isLoading?: boolean;
    searchQuery?: string;
    filters?: FilterState;
    [key: string]: unknown;
  }

  let { isLoading = $bindable(false), searchQuery = '', filters, ...rest }: Props = $props();
</script>

<div
  {...rest}
  data-testid="smart-search-results"
  data-loading={String(isLoading)}
  data-search-query={searchQuery}
  data-sort-order={filters?.sortOrder ?? ''}
></div>
