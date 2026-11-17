import { getAssetsByCity, getExploreData, getSearchSuggestions, searchPerson, searchPlaces } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

type SearchSuggestionsParams = Parameters<typeof getSearchSuggestions>[0];
type SearchPersonParams = Parameters<typeof searchPerson>[0];
type SearchPlacesParams = Parameters<typeof searchPlaces>[0];

export const searchQueryKey = ['search'];

export const getSearchSuggestionsQuery = (params: SearchSuggestionsParams) =>
  queryOptions({
    queryKey: [...searchQueryKey, 'suggestions', params],
    queryFn: ({ signal }) => getSearchSuggestions(params, { signal }),
    staleTime: 0,
  });

export const searchPersonQuery = (params: SearchPersonParams) =>
  queryOptions({
    queryKey: [...searchQueryKey, 'person', params],
    queryFn: ({ signal }) => searchPerson(params, { signal }),
    staleTime: 0,
  });

export const searchPlacesQuery = (params: SearchPlacesParams) =>
  queryOptions({
    queryKey: [...searchQueryKey, 'places', params],
    queryFn: ({ signal }) => searchPlaces(params, { signal }),
    staleTime: 0,
  });

export const getExploreDataQuery = () =>
  queryOptions({
    queryKey: [...searchQueryKey, 'explore'],
    queryFn: ({ signal }) => getExploreData({ signal }),
  });

export const getAssetsByCityQuery = () =>
  queryOptions({
    queryKey: [...searchQueryKey, 'cities'],
    queryFn: ({ signal }) => getAssetsByCity({ signal }),
  });
