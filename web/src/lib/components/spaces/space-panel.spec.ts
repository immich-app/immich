import TestWrapper from '$lib/components/TestWrapper.svelte';
import SpacePanel from '$lib/components/spaces/space-panel.svelte';
import { Role, type SharedSpaceMemberResponseDto, type SharedSpaceResponseDto } from '@immich/sdk';
import { fireEvent, render, screen } from '@testing-library/svelte';
import type { Component } from 'svelte';

function renderPanel(props: Record<string, unknown>) {
  return render(TestWrapper as Component<{ component: typeof SpacePanel; componentProps: typeof props }>, {
    component: SpacePanel,
    componentProps: props,
  });
}

const makeMember = (overrides: Partial<SharedSpaceMemberResponseDto> = {}): SharedSpaceMemberResponseDto => ({
  userId: 'user-1',
  name: 'Alice',
  email: 'alice@test.com',
  role: Role.Editor,
  joinedAt: '2026-01-01T00:00:00.000Z',
  showInTimeline: false,
  contributionCount: 0,
  ...overrides,
});

const makeSpace = (overrides: Partial<SharedSpaceResponseDto> = {}): SharedSpaceResponseDto => ({
  id: 'space-1',
  name: 'Family Photos',
  description: 'Our family memories',
  createdById: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  memberCount: 3,
  assetCount: 42,
  thumbnailAssetId: null,
  recentAssetIds: [],
  recentAssetThumbhashes: [],
  lastActivityAt: null,
  newAssetCount: 0,
  members: [],
  ...overrides,
});

describe('SpacePanel', () => {
  const defaultProps = {
    space: makeSpace(),
    members: [
      makeMember({ userId: 'u1', name: 'Alice', role: Role.Owner }),
      makeMember({ userId: 'u2', name: 'Bob', role: Role.Editor }),
    ],
    activities: [],
    currentUserId: 'u1',
    isOwner: true,
    open: true,
    onClose: vi.fn(),
    onMembersChanged: vi.fn(),
    onLoadMoreActivities: vi.fn(),
    hasMoreActivities: false,
  };

  it('should show Activity tab as active by default', () => {
    renderPanel(defaultProps);
    const activityTab = screen.getByTestId('tab-activity');
    expect(activityTab).toBeInTheDocument();
  });

  it('should show activity feed content by default', () => {
    renderPanel(defaultProps);
    expect(screen.getByTestId('activity-empty-state')).toBeInTheDocument();
  });

  it('should switch to Members tab on click', async () => {
    renderPanel(defaultProps);
    const membersTab = screen.getByTestId('tab-members');
    await fireEvent.click(membersTab);
    expect(screen.getByTestId('member-list')).toBeInTheDocument();
  });

  it('should show tab switcher', () => {
    renderPanel(defaultProps);
    expect(screen.getByTestId('tab-switcher')).toBeInTheDocument();
  });

  it('should have translate-x-full when closed', () => {
    renderPanel({ ...defaultProps, open: false });
    const panel = screen.getByTestId('space-panel');
    expect(panel.className).toContain('translate-x-full');
  });

  it('should have translate-x-0 when open', () => {
    renderPanel(defaultProps);
    const panel = screen.getByTestId('space-panel');
    expect(panel.className).toContain('translate-x-0');
  });

  it('should call onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    renderPanel({ ...defaultProps, onClose });
    const closeButton = screen.getByTestId('panel-close');
    await fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should show backdrop with blur when open', () => {
    renderPanel(defaultProps);
    const backdrop = screen.getByTestId('panel-backdrop');
    expect(backdrop.className).toContain('backdrop-blur');
  });

  it('should show member count in Members tab label', () => {
    renderPanel(defaultProps);
    const membersTab = screen.getByTestId('tab-members');
    expect(membersTab).toHaveTextContent('Members (2)');
  });
});
