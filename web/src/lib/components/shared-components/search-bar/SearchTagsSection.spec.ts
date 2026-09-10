import type { TagResponseDto } from '@immich/sdk';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';
import SearchTagsSection from '$lib/components/shared-components/search-bar/SearchTagsSection.svelte';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { searchManager } from '$lib/managers/search-manager.svelte';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';

const tag = (id: string, value: string): TagResponseDto => ({
  id,
  name: value,
  value,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});

describe('SearchTagsSection component', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    vi.stubGlobal('visualViewport', getVisualViewportMock());
    authManager.setUser(userAdminFactory.build());
    authManager.setPreferences(preferencesFactory.build({ tags: { enabled: true, sidebarWeb: true } }));
    searchManager.setQuery({ tagIds: ['tag-1', 'tag-2'] });
  });

  afterEach(() => {
    authManager.reset();
    searchManager.reset();
  });

  it('removes the tag when its chip is clicked', async () => {
    const user = userEvent.setup();
    render(SearchTagsSection, {
      props: { title: undefined, parentPromise: Promise.resolve([tag('tag-1', 'holiday'), tag('tag-2', 'family')]) },
    });

    await user.click(await screen.findByRole('button', { name: 'holiday' }));

    expect(screen.queryByRole('button', { name: 'holiday' })).not.toBeInTheDocument();
    expect([...(searchManager.filter.tagIds ?? [])]).toEqual(['tag-2']);
  });

  // removing the focused chip would otherwise drop focus to the body, which the
  // search bar treats as focus leaving the search panel
  it('keeps focus inside the section when a chip is removed', async () => {
    const user = userEvent.setup();
    const { container } = render(SearchTagsSection, {
      props: { title: undefined, parentPromise: Promise.resolve([tag('tag-1', 'holiday'), tag('tag-2', 'family')]) },
    });

    await user.click(await screen.findByRole('button', { name: 'holiday' }));

    expect(document.activeElement).not.toBe(document.body);
    expect(container.contains(document.activeElement)).toBe(true);
  });
});
