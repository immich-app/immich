import TestWrapper from '$lib/components/TestWrapper.svelte';
import SpaceActivityFeed from '$lib/components/spaces/space-activity-feed.svelte';
import { render, screen } from '@testing-library/svelte';
import type { Component } from 'svelte';

function renderFeed(props: Record<string, unknown>) {
  return render(TestWrapper as Component<{ component: typeof SpaceActivityFeed; componentProps: typeof props }>, {
    component: SpaceActivityFeed,
    componentProps: props,
  });
}

const makeActivity = (overrides: Record<string, unknown> = {}) => ({
  id: 'act-1',
  type: 'asset_add',
  data: { count: 5, assetIds: ['a1', 'a2'] },
  createdAt: new Date().toISOString(),
  userId: 'u1',
  userName: 'Pierre',
  userEmail: 'pierre@test.com',
  userProfileImagePath: null,
  userAvatarColor: 'primary',
  ...overrides,
});

describe('SpaceActivityFeed', () => {
  it('should show empty state when no activities', () => {
    renderFeed({ activities: [], spaceColor: 'primary', onLoadMore: vi.fn(), hasMore: false });
    expect(screen.getByTestId('activity-empty-state')).toBeInTheDocument();
  });

  it('should render asset_add event with user name and count', () => {
    const activities = [makeActivity({ type: 'asset_add', data: { count: 5, assetIds: ['a1', 'a2'] } })];
    renderFeed({ activities, spaceColor: 'primary', onLoadMore: vi.fn(), hasMore: false });
    expect(screen.getByTestId('activity-item-act-1')).toBeInTheDocument();
    expect(screen.getByTestId('activity-item-act-1')).toHaveTextContent('Pierre');
  });

  it('should render member_join event', () => {
    const activities = [makeActivity({ id: 'act-2', type: 'member_join', data: { role: 'editor' } })];
    renderFeed({ activities, spaceColor: 'primary', onLoadMore: vi.fn(), hasMore: false });
    expect(screen.getByTestId('activity-item-act-2')).toBeInTheDocument();
  });

  it('should render space_rename event with compact styling', () => {
    const activities = [
      makeActivity({
        id: 'act-3',
        type: 'space_rename',
        data: { oldName: 'Old', newName: 'New' },
        userName: 'Marie',
      }),
    ];
    renderFeed({ activities, spaceColor: 'primary', onLoadMore: vi.fn(), hasMore: false });
    expect(screen.getByTestId('activity-item-act-3')).toBeInTheDocument();
  });

  it('should show day headers', () => {
    const today = new Date().toISOString();
    const activities = [makeActivity({ createdAt: today })];
    renderFeed({ activities, spaceColor: 'primary', onLoadMore: vi.fn(), hasMore: false });
    expect(screen.getByTestId('day-header-0')).toBeInTheDocument();
  });

  it('should show load more button when hasMore is true', () => {
    renderFeed({ activities: [makeActivity()], spaceColor: 'primary', onLoadMore: vi.fn(), hasMore: true });
    expect(screen.getByTestId('load-more-button')).toBeInTheDocument();
  });

  it('should NOT show load more button when hasMore is false', () => {
    renderFeed({ activities: [makeActivity()], spaceColor: 'primary', onLoadMore: vi.fn(), hasMore: false });
    expect(screen.queryByTestId('load-more-button')).not.toBeInTheDocument();
  });
});
