import { queryClient } from '#lib/queries/client.ts';
import {
  getAllPeoplePagesQuery,
  getAllPeopleQuery,
  getPersonQuery,
  updateCachedPerson,
} from '#lib/queries/person.query.ts';
import { factory } from '#test/unit/factories.ts';
import type { PeopleResponseDto } from '@immich/sdk';
import type { InfiniteData } from '@tanstack/svelte-query';
import { afterEach, describe, expect, it } from 'vitest';

const toPeople = (people: PeopleResponseDto['people']): PeopleResponseDto => ({
  people,
  total: people.length,
  hidden: 0,
  hasNextPage: false,
});

describe('updateCachedPerson', () => {
  afterEach(() => {
    queryClient.clear();
  });

  it('updates the person in every cached people list and page', () => {
    const alice = factory.person({ name: 'Alice' });
    const bob = factory.person({ name: 'Bob' });
    const params = { withHidden: false };

    queryClient.setQueryData(getPersonQuery(alice.id).queryKey, alice);
    queryClient.setQueryData(getAllPeopleQuery(params).queryKey, toPeople([alice, bob]));
    queryClient.setQueryData(getAllPeoplePagesQuery(params).queryKey, {
      pages: [toPeople([alice]), toPeople([bob])],
      pageParams: [1, 2],
    });

    updateCachedPerson(alice.id, (person) => ({ ...person, name: 'Alicia' }));

    expect(queryClient.getQueryData(getPersonQuery(alice.id).queryKey)?.name).toBe('Alicia');
    expect(queryClient.getQueryData(getAllPeopleQuery(params).queryKey)?.people.map(({ name }) => name)).toEqual([
      'Alicia',
      'Bob',
    ]);
    const pages = queryClient.getQueryData<InfiniteData<PeopleResponseDto>>(getAllPeoplePagesQuery(params).queryKey);
    expect(pages?.pages.map(({ people }) => people.map(({ name }) => name))).toEqual([['Alicia'], ['Bob']]);
  });
});
