import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { asMutation, queryClient } from '#lib/queries/client.ts';
import {
  createPerson,
  getAllPeople,
  getPerson,
  getPersonStatistics,
  getUsersForPeople,
  mergePeople,
  reassignFaces,
  removeUsersFromPeople,
  updatePeople,
  updatePerson,
  upsertPeopleUsers,
  type PeopleResponseDto,
  type PersonResponseDto,
} from '@immich/sdk';
import { infiniteQueryOptions, queryOptions, type InfiniteData, type MutationMeta } from '@tanstack/svelte-query';

type GetAllPeopleParams = Parameters<typeof getAllPeople>[0];
type GetUsersForPeopleParams = Parameters<typeof getUsersForPeople>[0];

const peopleQueryKey = ['people'];

const invalidatePeople = () => queryClient.invalidateQueries({ queryKey: peopleQueryKey });

export const getAllPeopleQuery = (params: GetAllPeopleParams) =>
  queryOptions({
    queryKey: [...peopleQueryKey, 'list', params],
    queryFn: ({ signal }) => getAllPeople(params, { signal }),
  });

export const getAllPeoplePagesQuery = (params: GetAllPeopleParams) =>
  infiniteQueryOptions({
    queryKey: [...peopleQueryKey, 'pages', params],
    queryFn: ({ pageParam, signal }) => getAllPeople({ ...params, page: pageParam }, { signal }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: ({ hasNextPage }, pages) => (hasNextPage ? pages.length + 1 : undefined),
  });

export const fetchFirstPeoplePage = (params: GetAllPeopleParams) => {
  const options = getAllPeoplePagesQuery(params);
  queryClient.setQueryData(
    options.queryKey,
    (data) => data && { pages: data.pages.slice(0, 1), pageParams: data.pageParams.slice(0, 1) },
  );
  return queryClient.fetchInfiniteQuery({ ...options, staleTime: 0 });
};

export const getPersonQuery = (id: string) =>
  queryOptions({
    queryKey: [...peopleQueryKey, 'person', id],
    queryFn: ({ signal }) => getPerson({ id }, { signal }),
  });

export const getPersonStatisticsQuery = (id: string) =>
  queryOptions({
    queryKey: [...getPersonQuery(id).queryKey, 'statistics'],
    queryFn: ({ signal }) => getPersonStatistics({ id }, { signal }),
  });

export const getUsersForPeopleQuery = (params: GetUsersForPeopleParams) =>
  queryOptions({
    queryKey: [...peopleQueryKey, 'users', params],
    queryFn: ({ signal }) => getUsersForPeople(params, { signal }),
    staleTime: 0,
  });

export const updateCachedPerson = (id: string, update: (person: PersonResponseDto) => PersonResponseDto) => {
  const updatePage = (page: PeopleResponseDto) => ({
    ...page,
    people: page.people.map((person) => (person.id === id ? update(person) : person)),
  });

  queryClient.setQueryData(getPersonQuery(id).queryKey, (person) => person && update(person));
  queryClient.setQueriesData<PeopleResponseDto>(
    { queryKey: [...peopleQueryKey, 'list'] },
    (data) => data && updatePage(data),
  );
  queryClient.setQueriesData<InfiniteData<PeopleResponseDto>>(
    { queryKey: [...peopleQueryKey, 'pages'] },
    (data) => data && { ...data, pages: data.pages.map((page) => updatePage(page)) },
  );
};

export const createPersonMutation = (meta?: MutationMeta) =>
  asMutation(createPerson, { onSuccess: invalidatePeople, meta });

export const updatePersonMutation = (meta?: MutationMeta) =>
  asMutation(updatePerson, {
    onSuccess: (response, [{ id, personUpdateDto }]) => {
      const isOtherUser = !!personUpdateDto.userId && personUpdateDto.userId !== authManager.user.id;
      return isOtherUser ? invalidatePeople() : updateCachedPerson(id, () => response);
    },
    meta,
  });

export const updatePeopleMutation = (meta?: MutationMeta) =>
  asMutation(updatePeople, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: peopleQueryKey, refetchType: 'none' }),
    meta,
  });

export const mergePeopleMutation = (meta?: MutationMeta) =>
  asMutation(mergePeople, {
    onSuccess: (_, [{ mergePersonDto }]) => {
      for (const id of mergePersonDto.ids.slice(1)) {
        queryClient.removeQueries({ queryKey: getPersonQuery(id).queryKey });
      }
      return invalidatePeople();
    },
    meta,
  });

export const reassignFacesMutation = (meta?: MutationMeta) =>
  asMutation(reassignFaces, { onSuccess: invalidatePeople, meta });

export const upsertPeopleUsersMutation = () => asMutation(upsertPeopleUsers, { onSuccess: invalidatePeople });

export const removeUsersFromPeopleMutation = (meta?: MutationMeta) =>
  asMutation(removeUsersFromPeople, { onSuccess: invalidatePeople, meta });
