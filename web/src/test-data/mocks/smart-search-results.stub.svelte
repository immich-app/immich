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
  data-filter-favorite={String(filters?.isFavorite)}
  data-filter-not-in-album={String(filters?.isNotInAlbum)}
  data-filter-person-ids={filters?.personIds.join(',') ?? ''}
  data-filter-tag-ids={filters?.tagIds.join(',') ?? ''}
  data-filter-media-type={filters?.mediaType ?? ''}
  data-filter-rating={filters?.rating ?? ''}
  data-filter-date-after={filters?.dateAfter ?? ''}
  data-filter-date-before={filters?.dateBefore ?? ''}
  data-filter-city={filters?.city ?? ''}
  data-filter-country={filters?.country ?? ''}
  data-filter-make={filters?.make ?? ''}
  data-filter-model={filters?.model ?? ''}
  data-with-shared-spaces={String(withSharedSpaces)}
  data-space-id={spaceId ?? ''}
  data-country={filters?.country ?? ''}
  data-language={language}
  data-total={total ?? ''}
></div>
