import SpacesTable from '$lib/components/spaces/spaces-table.svelte';
import { Role, type SharedSpaceResponseDto } from '@immich/sdk';
import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

vi.mock('$lib/route', () => ({
  Route: {
    viewSpace: ({ id }: { id: string }) => `/spaces/${id}`,
  },
}));

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

const currentUserId = 'user-1';

describe('SpacesTable', () => {
  it('renders space name', () => {
    const spaces = [makeSpace({ name: 'My Space' })];
    const { getByText } = render(SpacesTable, { props: { spaces, currentUserId: 'user-1' } });
    expect(getByText('My Space')).toBeDefined();
  });

  it('renders asset count as a number', () => {
    const spaces = [makeSpace({ assetCount: 42 })];
    const { getByText } = render(SpacesTable, { props: { spaces, currentUserId: 'user-1' } });
    expect(getByText('42')).toBeDefined();
  });

  it('renders member count as a number', () => {
    const spaces = [makeSpace({ memberCount: 5 })];
    const { getByText } = render(SpacesTable, { props: { spaces, currentUserId: 'user-1' } });
    expect(getByText('5')).toBeDefined();
  });

  it('renders new-badge when newAssetCount > 0', () => {
    const spaces = [makeSpace({ id: 'sp1', newAssetCount: 3 })];
    const { getByTestId } = render(SpacesTable, { props: { spaces, currentUserId: 'user-1' } });
    expect(getByTestId('new-badge-sp1')).toBeDefined();
  });

  it('renders em-dash in new-cell when newAssetCount === 0', () => {
    const spaces = [makeSpace({ id: 'sp2', newAssetCount: 0 })];
    const { getByTestId } = render(SpacesTable, { props: { spaces, currentUserId: 'user-1' } });
    const cell = getByTestId('new-cell-sp2');
    expect(cell.textContent).toContain('—');
  });

  it('renders em-dash in new-cell when newAssetCount is undefined', () => {
    const spaces = [makeSpace({ id: 'sp3', newAssetCount: undefined })];
    const { getByTestId } = render(SpacesTable, { props: { spaces, currentUserId: 'user-1' } });
    const cell = getByTestId('new-cell-sp3');
    expect(cell.textContent).toContain('—');
  });

  it('renders role badge for the current user (owner)', () => {
    const spaces = [
      makeSpace({
        id: 'sp4',
        members: [
          {
            userId: 'user-1',
            name: 'Alice',
            email: 'alice@example.com',
            role: Role.Owner,
            showInTimeline: true,
            joinedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      }),
    ];
    const { getByTestId } = render(SpacesTable, { props: { spaces, currentUserId: 'user-1' } });
    expect(getByTestId('role-badge-owner')).toBeDefined();
  });

  it('renders color-bar for each space', () => {
    const spaces = [makeSpace({ id: 'sp5' })];
    const { getByTestId } = render(SpacesTable, { props: { spaces, currentUserId: 'user-1' } });
    expect(getByTestId('color-bar-sp5')).toBeDefined();
  });

  it('renders correct number of rows for multiple spaces', () => {
    const spaces = [
      makeSpace({ id: 's1', name: 'A' }),
      makeSpace({ id: 's2', name: 'B' }),
      makeSpace({ id: 's3', name: 'C' }),
    ];
    const { getAllByTestId } = render(SpacesTable, { props: { spaces, currentUserId: 'user-1' } });
    expect(getAllByTestId('space-row')).toHaveLength(3);
  });

  it('should show pin icon in name cell when pinned', () => {
    const space = makeSpace({ id: 'pinned-1' });
    const { getByTestId } = render(SpacesTable, {
      props: { spaces: [space], currentUserId, pinnedIds: ['pinned-1'], onTogglePin: vi.fn() },
    });
    expect(getByTestId('pin-icon-pinned-1')).toBeDefined();
  });

  it('should not show pin icon when not pinned', () => {
    const space = makeSpace({ id: 'unpinned-1' });
    const { queryByTestId } = render(SpacesTable, {
      props: { spaces: [space], currentUserId, pinnedIds: [], onTogglePin: vi.fn() },
    });
    expect(queryByTestId('pin-icon-unpinned-1')).toBeNull();
  });

  it('should show three-dot menu button on row hover', async () => {
    const user = userEvent.setup();
    const space = makeSpace({ id: 'hover-1' });
    const { getByTestId, queryByTestId } = render(SpacesTable, {
      props: { spaces: [space], currentUserId, pinnedIds: [], onTogglePin: vi.fn() },
    });
    expect(queryByTestId('row-menu-button-hover-1')).toBeNull();
    await user.hover(getByTestId('space-row'));
    expect(getByTestId('row-menu-button-hover-1')).toBeDefined();
  });

  it('should call onTogglePin when Pin to top clicked in row menu', async () => {
    const user = userEvent.setup();
    const onTogglePin = vi.fn();
    const space = makeSpace({ id: 'pin-1' });
    const { getByTestId, getByText } = render(SpacesTable, {
      props: { spaces: [space], currentUserId, pinnedIds: [], onTogglePin },
    });
    await user.hover(getByTestId('space-row'));
    await user.click(getByTestId('row-menu-button-pin-1'));
    await user.click(getByText('spaces_pin_to_top'));
    expect(onTogglePin).toHaveBeenCalledWith('pin-1');
  });
});
