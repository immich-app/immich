import TestWrapper from '$lib/components/TestWrapper.svelte';
import { Type, type PersonResponseDto, type SearchExploreResponseDto } from '@immich/sdk';
import { personFactory } from '@test-data/factories/person-factory';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import type { Component } from 'svelte';
import ExplorePage from './+page.svelte';

vi.mock('$lib/components/layouts/user-page-layout.svelte', async () => {
  const { default: MockComponent } = await import('$lib/components/spaces/mock-user-page-layout.test-wrapper.svelte');
  return { default: MockComponent };
});

function makePerson(overrides: Partial<PersonResponseDto> = {}): PersonResponseDto {
  return personFactory.build({
    id: 'person-1',
    name: 'Alice',
    isHidden: false,
    isFavorite: false,
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  });
}

function renderPage(people: PersonResponseDto[] = [makePerson()], items: SearchExploreResponseDto[] = []) {
  const props = {
    data: {
      items,
      response: {
        people,
        total: people.length,
        hidden: 0,
        hasNextPage: false,
      },
      meta: { title: 'Explore' },
    },
  };

  return render(TestWrapper as Component<{ component: typeof ExplorePage; componentProps: typeof props }>, {
    component: ExplorePage,
    componentProps: props,
  });
}

describe('Explore page', () => {
  it('uses the user profile id for user-primary identity rows', () => {
    renderPage([
      makePerson({
        id: 'identity-1',
        name: 'Alice',
        primaryProfile: { type: Type.UserPerson, id: 'user-person-1' },
      }),
    ]);

    expect(screen.getByRole('link', { name: 'Alice' })).toHaveAttribute('href', '/people/user-person-1');
    expect(document.querySelector('img')).toHaveAttribute(
      'src',
      '/api/people/user-person-1/thumbnail?updatedAt=2026-01-02T00%3A00%3A00.000Z',
    );
  });

  it('routes a space-primary person to the space person page and thumbnail', () => {
    renderPage([
      makePerson({
        id: 'identity-1',
        name: 'Shared Alice',
        primaryProfile: { type: Type.SpacePerson, id: 'space-person-1', spaceId: 'space-1' },
      }),
    ]);

    expect(screen.getByRole('link', { name: 'Shared Alice' })).toHaveAttribute(
      'href',
      '/spaces/space-1/people/space-person-1?previousRoute=%2Fexplore',
    );
    expect(document.querySelector('img')).toHaveAttribute(
      'src',
      '/api/shared-spaces/space-1/people/space-person-1/thumbnail?updatedAt=2026-01-02T00%3A00%3A00.000Z',
    );
  });
});
