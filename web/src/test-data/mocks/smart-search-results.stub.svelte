<script lang="ts">
  import type { FilterState } from '$lib/components/filter-panel/filter-panel';

  interface Props {
    isLoading?: boolean;
    searchQuery?: string;
    filters?: FilterState;
    withSharedSpaces?: boolean;
    spaceId?: string;
    language?: string;
    total?: number;
    [key: string]: unknown;
  }

  let {
    isLoading = $bindable(false),
    searchQuery = '',
    filters,
    withSharedSpaces,
    spaceId,
    language = '',
    total,
    ...rest
  }: Props = $props();
</script>

<div
  {...rest}
  data-testid="smart-search-results"
  data-loading={String(isLoading)}
  data-search-query={searchQuery}
  data-sort-order={filters?.sortOrder ?? ''}
  data-is-favorite={String(filters?.isFavorite)}
  data-with-shared-spaces={String(withSharedSpaces)}
  data-space-id={spaceId ?? ''}
  data-country={filters?.country ?? ''}
  data-language={language}
  data-total={total ?? ''}
></div>
