import { queryClient } from '#lib/queries/client.ts';
import { QueryKeys } from '#lib/queries/query-keys.ts';
import {
  getAssetsByCity,
  getExploreData,
  getSearchSuggestions,
  searchAssets,
  searchLargeAssets,
  searchPerson,
  searchPlaces,
  searchSmart,
  type AssetResponseDto,
  type MetadataSearchDto,
  type SearchResponseDto,
  type SmartSearchDto,
} from '@immich/sdk';
import { infiniteQueryOptions, queryOptions, type InfiniteData, type QueryKey } from '@tanstack/svelte-query';

type SearchSuggestionsParams = Parameters<typeof getSearchSuggestions>[0];
type SearchPersonParams = Parameters<typeof searchPerson>[0];
type SearchPlacesParams = Parameters<typeof searchPlaces>[0];

export const getSearchSuggestionsQuery = (params: SearchSuggestionsParams) =>
  queryOptions({
    queryKey: QueryKeys.searchSuggestions(params),
    queryFn: ({ signal }) => getSearchSuggestions(params, { signal }),
    staleTime: 0,
  });

export const searchPersonQuery = (params: SearchPersonParams) =>
  queryOptions({
    queryKey: QueryKeys.searchPerson(params),
    queryFn: ({ signal }) => searchPerson(params, { signal }),
    staleTime: 0,
  });

export const searchPlacesQuery = (params: SearchPlacesParams) =>
  queryOptions({
    queryKey: QueryKeys.searchPlaces(params),
    queryFn: ({ signal }) => searchPlaces(params, { signal }),
    staleTime: 0,
  });

export const getExploreDataQuery = () =>
  queryOptions({
    queryKey: QueryKeys.searchExplore(),
    queryFn: ({ signal }) => getExploreData({ signal }),
  });

export const getAssetsByCityQuery = () =>
  queryOptions({
    queryKey: QueryKeys.searchCities(),
    queryFn: ({ signal }) => getAssetsByCity({ signal }),
  });

const searchResultsOptions = {
  initialPageParam: 1,
  getNextPageParam: ({ assets }: SearchResponseDto) => (assets.nextPage ? Number(assets.nextPage) : undefined),
  staleTime: 0,
  gcTime: 0,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  meta: { error: { toast: 'loading_search_results_failed' } },
} as const;

export const searchAssetsQuery = (dto: MetadataSearchDto) =>
  infiniteQueryOptions({
    ...searchResultsOptions,
    queryKey: QueryKeys.searchMetadata(dto),
    queryFn: ({ pageParam, signal }) => searchAssets({ metadataSearchDto: { ...dto, page: pageParam } }, { signal }),
  });

export const searchSmartQuery = (dto: SmartSearchDto) =>
  infiniteQueryOptions({
    ...searchResultsOptions,
    queryKey: QueryKeys.searchSmart(dto),
    queryFn: ({ pageParam, signal }) => searchSmart({ smartSearchDto: { ...dto, page: pageParam } }, { signal }),
  });

export const updateSearchResults = (queryKey: QueryKey, update: (assets: AssetResponseDto[]) => AssetResponseDto[]) =>
  queryClient.setQueryData<InfiniteData<SearchResponseDto, number>>(
    queryKey,
    (results) =>
      results && {
        ...results,
        pages: results.pages.map((page) => ({ ...page, assets: { ...page.assets, items: update(page.assets.items) } })),
      },
  );

export const searchLargeAssetsQuery = () =>
  queryOptions({
    queryKey: QueryKeys.searchLargeAssets(),
    queryFn: ({ signal }) => searchLargeAssets({ minFileSize: 0 }, { signal }),
  });
