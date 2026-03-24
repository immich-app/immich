import { sdkMock } from '$lib/__mocks__/sdk.mock';
import RecentSpaces from '$lib/components/shared-components/side-bar/recent-spaces.svelte';
import { pinnedSpaceIds } from '$lib/stores/space-view.store';
import { userInteraction } from '$lib/stores/user.svelte';
import { Color } from '@immich/sdk';
import { sharedSpaceFactory } from '@test-data/factories/shared-space-factory';
import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';

vi.mock('$lib/utils/handle-error', () => ({
  handleError: vi.fn(),
}));

import { handleError } from '$lib/utils/handle-error';

describe('RecentSpaces component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    userInteraction.recentSpaces = undefined;
    pinnedSpaceIds.set([]);
  });

  const renderAndFlush = async () => {
    render(RecentSpaces);
    await tick();
    await tick();
  };

  describe('core behavior', () => {
    it('calls getAllSpaces on mount when cache is empty', async () => {
      sdkMock.getAllSpaces.mockResolvedValueOnce([]);
      await renderAndFlush();
      expect(sdkMock.getAllSpaces).toHaveBeenCalledTimes(1);
    });

    it('does not call getAllSpaces when cache is populated', async () => {
      userInteraction.recentSpaces = [sharedSpaceFactory.build()];
      await renderAndFlush();
      expect(sdkMock.getAllSpaces).not.toHaveBeenCalled();
    });

    it('sorts pinned spaces first, then by lastActivityAt descending', async () => {
      const pinned = sharedSpaceFactory.build({
        id: 'pinned-1',
        name: 'Pinned',
        lastActivityAt: '2024-01-01T00:00:00Z',
      });
      const recent = sharedSpaceFactory.build({
        id: 'recent-1',
        name: 'Recent',
        lastActivityAt: '2024-06-01T00:00:00Z',
      });
      const old = sharedSpaceFactory.build({ id: 'old-1', name: 'Old', lastActivityAt: '2024-03-01T00:00:00Z' });

      pinnedSpaceIds.set(['pinned-1']);
      sdkMock.getAllSpaces.mockResolvedValueOnce([recent, old, pinned]);
      await renderAndFlush();

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(3);
      expect(links[0]).toHaveAttribute('href', '/spaces/pinned-1');
      expect(links[1]).toHaveAttribute('href', '/spaces/recent-1');
      expect(links[2]).toHaveAttribute('href', '/spaces/old-1');
    });

    it('takes only top 3 spaces', async () => {
      const spaces = Array.from({ length: 5 }, (_, i) =>
        sharedSpaceFactory.build({ lastActivityAt: `2024-0${5 - i}-01T00:00:00Z` }),
      );

      sdkMock.getAllSpaces.mockResolvedValueOnce(spaces);
      await renderAndFlush();

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(3);
    });

    it('links to Route.viewSpace for each space', async () => {
      const space = sharedSpaceFactory.build({ id: 'abc-123' });
      sdkMock.getAllSpaces.mockResolvedValueOnce([space]);
      await renderAndFlush();

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/spaces/abc-123');
    });

    it('renders nothing when API returns zero spaces', async () => {
      sdkMock.getAllSpaces.mockResolvedValueOnce([]);
      await renderAndFlush();

      expect(screen.queryAllByRole('link')).toHaveLength(0);
    });
  });

  describe('colored dot', () => {
    it('shows colored dot when newAssetCount > 0', async () => {
      const space = sharedSpaceFactory.build({ id: 'dot-1', newAssetCount: 5, color: Color.Blue });
      sdkMock.getAllSpaces.mockResolvedValueOnce([space]);
      await renderAndFlush();

      expect(screen.getByTestId('sidebar-space-dot-dot-1')).toBeInTheDocument();
    });

    it('hides colored dot when newAssetCount === 0', async () => {
      const space = sharedSpaceFactory.build({ id: 'no-dot', newAssetCount: 0 });
      sdkMock.getAllSpaces.mockResolvedValueOnce([space]);
      await renderAndFlush();

      expect(screen.queryByTestId('sidebar-space-dot-no-dot')).not.toBeInTheDocument();
    });

    it('hides colored dot when newAssetCount is undefined', async () => {
      const space = sharedSpaceFactory.build({ id: 'undef-dot' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (space as any).newAssetCount = undefined;
      sdkMock.getAllSpaces.mockResolvedValueOnce([space]);
      await renderAndFlush();

      expect(screen.queryByTestId('sidebar-space-dot-undef-dot')).not.toBeInTheDocument();
    });

    it('applies correct bg class for blue color', async () => {
      const space = sharedSpaceFactory.build({ id: 'blue-1', newAssetCount: 3, color: Color.Blue });
      sdkMock.getAllSpaces.mockResolvedValueOnce([space]);
      await renderAndFlush();

      const dot = screen.getByTestId('sidebar-space-dot-blue-1');
      expect(dot.className).toContain('bg-blue-500');
    });

    it('applies correct bg class for red color', async () => {
      const space = sharedSpaceFactory.build({ id: 'red-1', newAssetCount: 3, color: Color.Red });
      sdkMock.getAllSpaces.mockResolvedValueOnce([space]);
      await renderAndFlush();

      const dot = screen.getByTestId('sidebar-space-dot-red-1');
      expect(dot.className).toContain('bg-red-500');
    });

    it('applies correct bg class for green color', async () => {
      const space = sharedSpaceFactory.build({ id: 'green-1', newAssetCount: 3, color: Color.Green });
      sdkMock.getAllSpaces.mockResolvedValueOnce([space]);
      await renderAndFlush();

      const dot = screen.getByTestId('sidebar-space-dot-green-1');
      expect(dot.className).toContain('bg-green-600');
    });

    it('falls back to primary color when color is null', async () => {
      const space = sharedSpaceFactory.build({ id: 'null-color', newAssetCount: 2, color: null });
      sdkMock.getAllSpaces.mockResolvedValueOnce([space]);
      await renderAndFlush();

      const dot = screen.getByTestId('sidebar-space-dot-null-color');
      expect(dot.className).toContain('bg-immich-primary');
    });

    it('falls back to primary color when color is undefined', async () => {
      const space = sharedSpaceFactory.build({ id: 'undef-color', newAssetCount: 2 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (space as any).color = undefined;
      sdkMock.getAllSpaces.mockResolvedValueOnce([space]);
      await renderAndFlush();

      const dot = screen.getByTestId('sidebar-space-dot-undef-color');
      expect(dot.className).toContain('bg-immich-primary');
    });
  });

  describe('sorting edge cases', () => {
    it('sorts null lastActivityAt to the end', async () => {
      const recent = sharedSpaceFactory.build({ id: 'recent', lastActivityAt: '2024-06-01T00:00:00Z' });
      const nullActivity = sharedSpaceFactory.build({ id: 'null-activity', lastActivityAt: null });

      sdkMock.getAllSpaces.mockResolvedValueOnce([nullActivity, recent]);
      await renderAndFlush();

      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveAttribute('href', '/spaces/recent');
      expect(links[1]).toHaveAttribute('href', '/spaces/null-activity');
    });

    it('pinned space with old activity appears before unpinned with recent activity', async () => {
      const pinnedOld = sharedSpaceFactory.build({ id: 'pinned-old', lastActivityAt: '2020-01-01T00:00:00Z' });
      const unpinnedRecent = sharedSpaceFactory.build({
        id: 'unpinned-recent',
        lastActivityAt: '2024-12-01T00:00:00Z',
      });

      pinnedSpaceIds.set(['pinned-old']);
      sdkMock.getAllSpaces.mockResolvedValueOnce([unpinnedRecent, pinnedOld]);
      await renderAndFlush();

      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveAttribute('href', '/spaces/pinned-old');
      expect(links[1]).toHaveAttribute('href', '/spaces/unpinned-recent');
    });

    it('preserves input order when all spaces have same lastActivityAt (stable sort)', async () => {
      const sameTime = '2024-06-01T00:00:00Z';
      const a = sharedSpaceFactory.build({ id: 'a', lastActivityAt: sameTime });
      const b = sharedSpaceFactory.build({ id: 'b', lastActivityAt: sameTime });
      const c = sharedSpaceFactory.build({ id: 'c', lastActivityAt: sameTime });

      sdkMock.getAllSpaces.mockResolvedValueOnce([a, b, c]);
      await renderAndFlush();

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(3);
      expect(links[0]).toHaveAttribute('href', '/spaces/a');
      expect(links[1]).toHaveAttribute('href', '/spaces/b');
      expect(links[2]).toHaveAttribute('href', '/spaces/c');
    });

    it('fills all 3 slots with pinned spaces when 3+ are pinned', async () => {
      const spaces = Array.from({ length: 5 }, (_, i) =>
        sharedSpaceFactory.build({ id: `s${i}`, lastActivityAt: `2024-0${5 - i}-01T00:00:00Z` }),
      );

      pinnedSpaceIds.set(['s0', 's1', 's2', 's3']);
      sdkMock.getAllSpaces.mockResolvedValueOnce(spaces);
      await renderAndFlush();

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(3);
      // All 3 should be pinned spaces (sorted by activity desc among pinned)
      const hrefs = links.map((l) => l.getAttribute('href'));
      expect(hrefs.every((h) => ['s0', 's1', 's2', 's3'].some((id) => h === `/spaces/${id}`))).toBe(true);
    });
  });

  describe('error handling', () => {
    it('renders nothing when getAllSpaces rejects', async () => {
      sdkMock.getAllSpaces.mockRejectedValueOnce(new Error('Network error'));
      await renderAndFlush();

      expect(screen.queryAllByRole('link')).toHaveLength(0);
    });

    it('calls handleError on API failure', async () => {
      const error = new Error('Network error');
      sdkMock.getAllSpaces.mockRejectedValueOnce(error);
      await renderAndFlush();

      expect(handleError).toHaveBeenCalledWith(error, expect.any(String));
    });
  });

  describe('pin reactivity', () => {
    it('re-sorts when pinnedSpaceIds changes', async () => {
      const a = sharedSpaceFactory.build({ id: 'a', lastActivityAt: '2024-01-01T00:00:00Z' });
      const b = sharedSpaceFactory.build({ id: 'b', lastActivityAt: '2024-06-01T00:00:00Z' });

      sdkMock.getAllSpaces.mockResolvedValueOnce([a, b]);
      await renderAndFlush();

      // Initially: b first (more recent), a second
      let links = screen.getAllByRole('link');
      expect(links[0]).toHaveAttribute('href', '/spaces/b');
      expect(links[1]).toHaveAttribute('href', '/spaces/a');

      // Pin 'a' — should now appear first
      pinnedSpaceIds.set(['a']);
      await tick();
      await tick();

      links = screen.getAllByRole('link');
      expect(links[0]).toHaveAttribute('href', '/spaces/a');
      expect(links[1]).toHaveAttribute('href', '/spaces/b');
    });
  });
});
