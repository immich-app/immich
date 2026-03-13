import SpacesControls from '$lib/components/spaces/spaces-controls.svelte';
import { SpaceSortBy, spaceViewSettings } from '$lib/stores/space-view.store';
import type { SharedSpaceResponseDto } from '@immich/sdk';
import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { get } from 'svelte/store';

const makeSpace = (overrides: Partial<SharedSpaceResponseDto> = {}): SharedSpaceResponseDto => ({
  id: 'space-1',
  name: 'Alpha',
  description: null,
  createdById: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  thumbnailAssetId: null,
  lastActivityAt: null,
  assetCount: 0,
  memberCount: 1,
  recentAssetIds: [],
  recentAssetThumbhashes: [],
  members: [],
  ...overrides,
});

// Extract sort function for testing (same logic as in the component)
const sortSpaces = (items: SharedSpaceResponseDto[], sortBy: string, sortOrder: string) => {
  const sorted = [...items].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case SpaceSortBy.Name: {
        comparison = a.name.localeCompare(b.name);
        break;
      }
      case SpaceSortBy.LastActivity: {
        const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
        const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
        comparison = aTime - bTime;
        break;
      }
      case SpaceSortBy.DateCreated: {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      }
      case SpaceSortBy.AssetCount: {
        comparison = (a.assetCount ?? 0) - (b.assetCount ?? 0);
        break;
      }
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  return sorted;
};

const alpha = makeSpace({
  id: 's1',
  name: 'Alpha',
  createdAt: '2026-01-01T00:00:00.000Z',
  assetCount: 5,
  lastActivityAt: '2026-03-01T00:00:00.000Z',
});
const beta = makeSpace({
  id: 's2',
  name: 'Beta',
  createdAt: '2026-02-01T00:00:00.000Z',
  assetCount: 20,
  lastActivityAt: '2026-03-05T00:00:00.000Z',
});
const gamma = makeSpace({
  id: 's3',
  name: 'Gamma',
  createdAt: '2026-03-01T00:00:00.000Z',
  assetCount: 10,
  lastActivityAt: null,
});

describe('Space sorting logic', () => {
  it('should sort by name ascending', () => {
    const result = sortSpaces([gamma, alpha, beta], SpaceSortBy.Name, 'asc');
    expect(result.map((s) => s.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  it('should sort by name descending', () => {
    const result = sortSpaces([alpha, beta, gamma], SpaceSortBy.Name, 'desc');
    expect(result.map((s) => s.name)).toEqual(['Gamma', 'Beta', 'Alpha']);
  });

  it('should sort by last activity newest first', () => {
    const result = sortSpaces([alpha, beta, gamma], SpaceSortBy.LastActivity, 'desc');
    expect(result.map((s) => s.name)).toEqual(['Beta', 'Alpha', 'Gamma']);
  });

  it('should sort by last activity oldest first', () => {
    const result = sortSpaces([alpha, beta, gamma], SpaceSortBy.LastActivity, 'asc');
    expect(result.map((s) => s.name)).toEqual(['Gamma', 'Alpha', 'Beta']);
  });

  it('should sort by date created newest first', () => {
    const result = sortSpaces([alpha, beta, gamma], SpaceSortBy.DateCreated, 'desc');
    expect(result.map((s) => s.name)).toEqual(['Gamma', 'Beta', 'Alpha']);
  });

  it('should sort by date created oldest first', () => {
    const result = sortSpaces([alpha, beta, gamma], SpaceSortBy.DateCreated, 'asc');
    expect(result.map((s) => s.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  it('should sort by asset count highest first', () => {
    const result = sortSpaces([alpha, beta, gamma], SpaceSortBy.AssetCount, 'desc');
    expect(result.map((s) => s.name)).toEqual(['Beta', 'Gamma', 'Alpha']);
  });

  it('should sort by asset count lowest first', () => {
    const result = sortSpaces([alpha, beta, gamma], SpaceSortBy.AssetCount, 'asc');
    expect(result.map((s) => s.name)).toEqual(['Alpha', 'Gamma', 'Beta']);
  });

  it('should sort null lastActivityAt to end when sorting desc', () => {
    const result = sortSpaces([gamma, beta, alpha], SpaceSortBy.LastActivity, 'desc');
    expect(result.at(-1)!.name).toBe('Gamma');
  });

  it('should sort null lastActivityAt to start when sorting asc', () => {
    const result = sortSpaces([beta, alpha, gamma], SpaceSortBy.LastActivity, 'asc');
    expect(result[0].name).toBe('Gamma');
  });
});

describe('SpacesControls', () => {
  beforeEach(() => {
    localStorage.clear();
    spaceViewSettings.reset();
  });

  it('should render view toggle button', () => {
    const spaces = [makeSpace()];
    const { getByTestId } = render(SpacesControls, { props: { spaces, onSorted: vi.fn() } });
    expect(getByTestId('view-toggle')).toBeDefined();
  });

  it('should toggle viewMode from card to list on click', async () => {
    const user = userEvent.setup();
    const spaces = [makeSpace()];
    const { getByTestId } = render(SpacesControls, { props: { spaces, onSorted: vi.fn() } });

    expect(get(spaceViewSettings).viewMode).toBe('card');
    await user.click(getByTestId('view-toggle'));
    expect(get(spaceViewSettings).viewMode).toBe('list');
  });

  it('should toggle viewMode from list back to card on click', async () => {
    const user = userEvent.setup();
    spaceViewSettings.update((s) => ({ ...s, viewMode: 'list' }));
    const spaces = [makeSpace()];
    const { getByTestId } = render(SpacesControls, { props: { spaces, onSorted: vi.fn() } });

    await user.click(getByTestId('view-toggle'));
    expect(get(spaceViewSettings).viewMode).toBe('card');
  });
});
