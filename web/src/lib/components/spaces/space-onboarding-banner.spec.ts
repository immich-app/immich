import SpaceOnboardingBanner from '$lib/components/spaces/space-onboarding-banner.svelte';
import type { SharedSpaceResponseDto } from '@immich/sdk';
import { fireEvent, render, screen } from '@testing-library/svelte';

const makeSpace = (overrides: Partial<SharedSpaceResponseDto> = {}): SharedSpaceResponseDto => ({
  id: 'space-1',
  name: 'Family Photos',
  description: 'Our family memories',
  createdById: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  memberCount: 1,
  assetCount: 0,
  thumbnailAssetId: null,
  recentAssetIds: [],
  recentAssetThumbhashes: [],
  lastActivityAt: null,
  newAssetCount: 0,
  members: [],
  ...overrides,
});

const defaultProps = {
  space: makeSpace(),
  gradientClass: 'from-indigo-400 to-cyan-600',
  onAddPhotos: vi.fn(),
  onInviteMembers: vi.fn(),
  onSetCover: vi.fn(),
};

describe('SpaceOnboardingBanner', () => {
  it('should render banner when no steps are complete', () => {
    render(SpaceOnboardingBanner, { ...defaultProps, space: makeSpace() });
    expect(screen.getByTestId('onboarding-banner')).toBeInTheDocument();
  });

  it('should hide banner when all 3 steps are complete', () => {
    render(SpaceOnboardingBanner, {
      ...defaultProps,
      space: makeSpace({ assetCount: 5, memberCount: 2, thumbnailAssetId: 'asset-1' }),
    });
    expect(screen.queryByTestId('onboarding-banner')).not.toBeInTheDocument();
  });

  it('should show progress text with translation key', () => {
    render(SpaceOnboardingBanner, { ...defaultProps, space: makeSpace() });
    const progressText = screen.getByTestId('progress-text');
    expect(progressText).toHaveTextContent('spaces_setup_steps_done');
  });

  it('should still render progress text when one step complete', () => {
    render(SpaceOnboardingBanner, { ...defaultProps, space: makeSpace({ assetCount: 5 }) });
    const progressText = screen.getByTestId('progress-text');
    expect(progressText).toBeInTheDocument();
  });

  it('should still render progress text when two steps complete', () => {
    render(SpaceOnboardingBanner, {
      ...defaultProps,
      space: makeSpace({ assetCount: 5, memberCount: 2 }),
    });
    const progressText = screen.getByTestId('progress-text');
    expect(progressText).toBeInTheDocument();
  });

  it('should show checkmark for completed add-photos step', () => {
    render(SpaceOnboardingBanner, { ...defaultProps, space: makeSpace({ assetCount: 5 }) });
    expect(screen.getByTestId('step-add-photos-check')).toBeInTheDocument();
  });

  it('should show checkmark for completed invite-members step', () => {
    render(SpaceOnboardingBanner, { ...defaultProps, space: makeSpace({ memberCount: 2 }) });
    expect(screen.getByTestId('step-invite-members-check')).toBeInTheDocument();
  });

  it('should show checkmark for completed set-cover step', () => {
    render(SpaceOnboardingBanner, {
      ...defaultProps,
      space: makeSpace({ thumbnailAssetId: 'asset-1' }),
    });
    expect(screen.getByTestId('step-set-cover-check')).toBeInTheDocument();
  });

  it('should show action button for incomplete steps', () => {
    render(SpaceOnboardingBanner, { ...defaultProps, space: makeSpace() });
    expect(screen.getByTestId('step-add-photos-action')).toBeInTheDocument();
    expect(screen.getByTestId('step-invite-members-action')).toBeInTheDocument();
    expect(screen.getByTestId('step-set-cover-action')).toBeInTheDocument();
  });

  it('should hide action button for completed steps', () => {
    render(SpaceOnboardingBanner, {
      ...defaultProps,
      space: makeSpace({ assetCount: 5, memberCount: 2 }),
    });
    expect(screen.queryByTestId('step-add-photos-action')).not.toBeInTheDocument();
    expect(screen.queryByTestId('step-invite-members-action')).not.toBeInTheDocument();
  });

  it('should call onAddPhotos callback when add photos action clicked', async () => {
    const onAddPhotos = vi.fn();
    render(SpaceOnboardingBanner, { ...defaultProps, onAddPhotos });
    await fireEvent.click(screen.getByTestId('step-add-photos-action'));
    expect(onAddPhotos).toHaveBeenCalledTimes(1);
  });

  it('should call onInviteMembers callback when invite action clicked', async () => {
    const onInviteMembers = vi.fn();
    render(SpaceOnboardingBanner, { ...defaultProps, onInviteMembers });
    await fireEvent.click(screen.getByTestId('step-invite-members-action'));
    expect(onInviteMembers).toHaveBeenCalledTimes(1);
  });

  it('should call onSetCover callback when set cover action clicked', async () => {
    const onSetCover = vi.fn();
    render(SpaceOnboardingBanner, { ...defaultProps, onSetCover });
    await fireEvent.click(screen.getByTestId('step-set-cover-action'));
    expect(onSetCover).toHaveBeenCalledTimes(1);
  });

  it('should toggle collapsed state when collapse button clicked', async () => {
    render(SpaceOnboardingBanner, { ...defaultProps, space: makeSpace() });
    const banner = screen.getByTestId('onboarding-banner');
    expect(banner.dataset.collapsed).toBe('false');

    await fireEvent.click(screen.getByTestId('banner-collapse-toggle'));
    expect(banner.dataset.collapsed).toBe('true');

    await fireEvent.click(screen.getByTestId('banner-collapse-toggle'));
    expect(banner.dataset.collapsed).toBe('false');
  });

  it('should set progress bar width to 0% when no steps complete', () => {
    render(SpaceOnboardingBanner, { ...defaultProps, space: makeSpace() });
    const fill = screen.getByTestId('progress-bar-fill');
    expect(fill.style.width).toBe('0%');
  });

  it('should set progress bar width to 33% when one step complete', () => {
    render(SpaceOnboardingBanner, { ...defaultProps, space: makeSpace({ assetCount: 5 }) });
    const fill = screen.getByTestId('progress-bar-fill');
    expect(fill.style.width).toBe('33%');
  });

  it('should update invite-members step when space.memberCount changes from 1 to 2', async () => {
    const { rerender } = render(SpaceOnboardingBanner, { ...defaultProps, space: makeSpace({ memberCount: 1 }) });
    expect(screen.getByTestId('step-invite-members-action')).toBeInTheDocument();
    expect(screen.queryByTestId('step-invite-members-check')).not.toBeInTheDocument();

    await rerender({ ...defaultProps, space: makeSpace({ memberCount: 2 }) });
    expect(screen.getByTestId('step-invite-members-check')).toBeInTheDocument();
    expect(screen.queryByTestId('step-invite-members-action')).not.toBeInTheDocument();
  });

  it('should set progress bar width to 67% when two steps complete', () => {
    render(SpaceOnboardingBanner, {
      ...defaultProps,
      space: makeSpace({ assetCount: 5, memberCount: 2 }),
    });
    const fill = screen.getByTestId('progress-bar-fill');
    expect(fill.style.width).toBe('67%');
  });

  describe('step completion combinations', () => {
    it('should show banner with only photos complete', () => {
      render(SpaceOnboardingBanner, {
        ...defaultProps,
        space: makeSpace({ assetCount: 5, memberCount: 1, thumbnailAssetId: null }),
      });
      expect(screen.getByTestId('onboarding-banner')).toBeInTheDocument();
      expect(screen.getByTestId('step-add-photos-check')).toBeInTheDocument();
      expect(screen.getByTestId('step-invite-members-action')).toBeInTheDocument();
      expect(screen.getByTestId('step-set-cover-action')).toBeInTheDocument();
    });

    it('should show banner with only members complete', () => {
      render(SpaceOnboardingBanner, {
        ...defaultProps,
        space: makeSpace({ assetCount: 0, memberCount: 2, thumbnailAssetId: null }),
      });
      expect(screen.getByTestId('onboarding-banner')).toBeInTheDocument();
      expect(screen.getByTestId('step-add-photos-action')).toBeInTheDocument();
      expect(screen.getByTestId('step-invite-members-check')).toBeInTheDocument();
      expect(screen.getByTestId('step-set-cover-action')).toBeInTheDocument();
    });

    it('should show banner with only cover complete', () => {
      render(SpaceOnboardingBanner, {
        ...defaultProps,
        space: makeSpace({ assetCount: 0, memberCount: 1, thumbnailAssetId: 'asset-1' }),
      });
      expect(screen.getByTestId('onboarding-banner')).toBeInTheDocument();
      expect(screen.getByTestId('step-add-photos-action')).toBeInTheDocument();
      expect(screen.getByTestId('step-invite-members-action')).toBeInTheDocument();
      expect(screen.getByTestId('step-set-cover-check')).toBeInTheDocument();
    });

    it('should show banner with photos + members complete but no cover', () => {
      render(SpaceOnboardingBanner, {
        ...defaultProps,
        space: makeSpace({ assetCount: 5, memberCount: 2, thumbnailAssetId: null }),
      });
      expect(screen.getByTestId('onboarding-banner')).toBeInTheDocument();
      expect(screen.getByTestId('step-add-photos-check')).toBeInTheDocument();
      expect(screen.getByTestId('step-invite-members-check')).toBeInTheDocument();
      expect(screen.getByTestId('step-set-cover-action')).toBeInTheDocument();
    });

    it('should show banner with photos + cover complete but no members', () => {
      render(SpaceOnboardingBanner, {
        ...defaultProps,
        space: makeSpace({ assetCount: 5, memberCount: 1, thumbnailAssetId: 'asset-1' }),
      });
      expect(screen.getByTestId('onboarding-banner')).toBeInTheDocument();
      expect(screen.getByTestId('step-add-photos-check')).toBeInTheDocument();
      expect(screen.getByTestId('step-invite-members-action')).toBeInTheDocument();
      expect(screen.getByTestId('step-set-cover-check')).toBeInTheDocument();
    });

    it('should show banner with members + cover complete but no photos', () => {
      render(SpaceOnboardingBanner, {
        ...defaultProps,
        space: makeSpace({ assetCount: 0, memberCount: 2, thumbnailAssetId: 'asset-1' }),
      });
      expect(screen.getByTestId('onboarding-banner')).toBeInTheDocument();
      expect(screen.getByTestId('step-add-photos-action')).toBeInTheDocument();
      expect(screen.getByTestId('step-invite-members-check')).toBeInTheDocument();
      expect(screen.getByTestId('step-set-cover-check')).toBeInTheDocument();
    });
  });

  describe('banner disappears after completing all steps via rerender', () => {
    it('should disappear when going from 0/3 to 3/3', async () => {
      const { rerender } = render(SpaceOnboardingBanner, { ...defaultProps, space: makeSpace() });
      expect(screen.getByTestId('onboarding-banner')).toBeInTheDocument();

      await rerender({
        ...defaultProps,
        space: makeSpace({ assetCount: 5, memberCount: 2, thumbnailAssetId: 'asset-1' }),
      });
      expect(screen.queryByTestId('onboarding-banner')).not.toBeInTheDocument();
    });

    it('should disappear when completing steps one at a time', async () => {
      const { rerender } = render(SpaceOnboardingBanner, { ...defaultProps, space: makeSpace() });
      expect(screen.getByTestId('onboarding-banner')).toBeInTheDocument();
      expect(screen.getByTestId('progress-bar-fill').style.width).toBe('0%');

      // Step 1: add photos
      await rerender({ ...defaultProps, space: makeSpace({ assetCount: 5 }) });
      expect(screen.getByTestId('onboarding-banner')).toBeInTheDocument();
      expect(screen.getByTestId('step-add-photos-check')).toBeInTheDocument();
      expect(screen.getByTestId('progress-bar-fill').style.width).toBe('33%');

      // Step 2: invite members
      await rerender({ ...defaultProps, space: makeSpace({ assetCount: 5, memberCount: 2 }) });
      expect(screen.getByTestId('onboarding-banner')).toBeInTheDocument();
      expect(screen.getByTestId('step-invite-members-check')).toBeInTheDocument();
      expect(screen.getByTestId('progress-bar-fill').style.width).toBe('67%');

      // Step 3: set cover — banner disappears
      await rerender({
        ...defaultProps,
        space: makeSpace({ assetCount: 5, memberCount: 2, thumbnailAssetId: 'asset-1' }),
      });
      expect(screen.queryByTestId('onboarding-banner')).not.toBeInTheDocument();
    });
  });
});
