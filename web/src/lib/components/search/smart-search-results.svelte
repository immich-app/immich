<script lang="ts">
  import SpaceSearchResults from '$lib/components/spaces/space-search-results.svelte';
  import type { FilterState } from '$lib/components/filter-panel/filter-panel';
  import { dedupeAppend } from '$lib/utils/search-dedup';
  import { buildSmartSearchParams, SEARCH_FILTER_DEBOUNCE_MS } from '$lib/utils/space-search';
  import { searchSmart, type AssetResponseDto } from '@immich/sdk';

  interface Props {
    searchQuery: string;
    filters: FilterState;
    spaceId?: string;
    withSharedSpaces?: boolean;
    isShared: boolean;
    isLoading?: boolean;
  }

  let { searchQuery, filters, spaceId, withSharedSpaces, isShared, isLoading = $bindable(false) }: Props = $props();

  let searchResults = $state<AssetResponseDto[]>([]);
  let hasMoreResults = $state(false);
  let searchPage = $state(1);
  let searchAbortController: AbortController | undefined;

  const executeSearch = async (page: number, append: boolean) => {
    const query = searchQuery.trim();
    if (!query) {
      return;
    }

    searchAbortController?.abort();
    const controller = new AbortController();
    searchAbortController = controller;

    isLoading = true;
    try {
      const { assets } = await searchSmart({
        smartSearchDto: {
          ...buildSmartSearchParams({ query, filters, spaceId, withSharedSpaces }),
          page,
          size: 100,
        },
      });

      if (controller.signal.aborted) {
        return;
      }

      // On append, dedupe by id — primary guard against duplicate rows across
      // paginated searchSmart responses. The server's ORDER BY is single-key
      // (smart_search.embedding <=>) so that vchord's ordered index scan can
      // be used; identical embeddings (byte-identical image content) can then
      // yield the same asset.id on adjacent pages. See
      // docs/plans/2026-04-21-search-tiebreaker-design.md.
      searchResults = append ? dedupeAppend(searchResults, assets.items) : assets.items;
      searchPage = page;
      hasMoreResults = assets.nextPage !== null;
    } catch {
      if (controller.signal.aborted) {
        return;
      }
      searchResults = append ? searchResults : [];
      hasMoreResults = false;
    } finally {
      if (!controller.signal.aborted) {
        isLoading = false;
      }
    }
  };

  const handleLoadMore = () => {
    void executeSearch(searchPage + 1, true);
  };

  $effect(() => {
    // Track everything that should trigger a re-search
    const _ = [
      searchQuery,
      filters.personIds,
      filters.city,
      filters.country,
      filters.make,
      filters.model,
      filters.tagIds,
      filters.rating,
      filters.mediaType,
      filters.dateAfter,
      filters.dateBefore,
      filters.selectedYear,
      filters.selectedMonth,
      filters.sortOrder,
      filters.isFavorite,
    ];

    if (!searchQuery.trim()) {
      return;
    }

    const timeout = setTimeout(() => {
      searchPage = 1;
      void executeSearch(1, false);
    }, SEARCH_FILTER_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      searchAbortController?.abort();
    };
  });
</script>

<SpaceSearchResults
  results={searchResults}
  {isLoading}
  hasMore={hasMoreResults}
  totalLoaded={searchResults.length}
  onLoadMore={handleLoadMore}
  {spaceId}
  {isShared}
  sortMode={filters.sortOrder}
/>
