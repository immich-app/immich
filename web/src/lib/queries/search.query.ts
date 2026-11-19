import { QueryKeys } from '#lib/queries/query-keys.ts';
import { getAssetsByCity, getExploreData, getSearchSuggestions, searchPerson, searchPlaces } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

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
