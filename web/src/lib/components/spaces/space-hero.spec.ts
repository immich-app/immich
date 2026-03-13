import SpaceHero from '$lib/components/spaces/space-hero.svelte';
import type { SharedSpaceResponseDto } from '@immich/sdk';
import { render, screen } from '@testing-library/svelte';

const makeSpace = (overrides: Partial<SharedSpaceResponseDto> = {}): SharedSpaceResponseDto => ({
  id: 'space-1',
  name: 'Family Trip',
  description: null,
  createdById: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  thumbnailAssetId: null,
  ...overrides,
});

describe('SpaceHero component', () => {
  it('should render the space name', () => {
    render(SpaceHero, { space: makeSpace({ name: 'Alps Hiking' }), memberCount: 3, assetCount: 42 });
    expect(screen.getByTestId('hero-title')).toHaveTextContent('Alps Hiking');
  });

  it('should render cover image when thumbnailAssetId is set', () => {
    render(SpaceHero, { space: makeSpace({ thumbnailAssetId: 'asset-1' }), memberCount: 3, assetCount: 42 });
    expect(screen.getByTestId('hero-cover-image')).toBeInTheDocument();
    expect(screen.queryByTestId('hero-gradient')).not.toBeInTheDocument();
  });

  it('should render gradient background when no cover photo', () => {
    render(SpaceHero, {
      space: makeSpace({ thumbnailAssetId: null }),
      memberCount: 3,
      assetCount: 42,
      gradientClass: 'from-blue-400 to-blue-600',
    });
    expect(screen.getByTestId('hero-gradient')).toBeInTheDocument();
    expect(screen.queryByTestId('hero-cover-image')).not.toBeInTheDocument();
  });

  it('should display asset count', () => {
    render(SpaceHero, { space: makeSpace(), memberCount: 3, assetCount: 99 });
    expect(screen.getByTestId('hero-photo-count')).toHaveTextContent('99');
  });

  it('should display member count', () => {
    render(SpaceHero, { space: makeSpace(), memberCount: 7, assetCount: 0 });
    expect(screen.getByTestId('hero-member-count')).toHaveTextContent('7');
  });

  it('should display role badge when currentRole is provided', () => {
    render(SpaceHero, { space: makeSpace(), memberCount: 1, assetCount: 0, currentRole: 'editor' });
    expect(screen.getByTestId('hero-role-badge')).toHaveTextContent('Editor');
  });

  it('should not display role badge when currentRole is not provided', () => {
    render(SpaceHero, { space: makeSpace(), memberCount: 1, assetCount: 0 });
    expect(screen.queryByTestId('hero-role-badge')).not.toBeInTheDocument();
  });

  it('should display description when present', () => {
    render(SpaceHero, { space: makeSpace({ description: 'A lovely trip' }), memberCount: 1, assetCount: 0 });
    expect(screen.getByTestId('hero-description')).toHaveTextContent('A lovely trip');
  });

  it('should show "Show more" for long descriptions', () => {
    const longDesc = 'A'.repeat(200);
    render(SpaceHero, { space: makeSpace({ description: longDesc }), memberCount: 1, assetCount: 0 });
    expect(screen.getByTestId('hero-show-more')).toBeInTheDocument();
  });

  // Task 5: object-position from thumbnailCropY
  it('should apply default center position when thumbnailCropY is null', () => {
    render(SpaceHero, {
      space: makeSpace({ thumbnailAssetId: 'asset-1', thumbnailCropY: null }),
      memberCount: 1,
      assetCount: 0,
    });
    const img = screen.getByTestId('hero-cover-image');
    expect(img.style.objectPosition).toContain('50%');
  });

  it('should apply custom position from thumbnailCropY', () => {
    render(SpaceHero, {
      space: makeSpace({ thumbnailAssetId: 'asset-1', thumbnailCropY: 25 }),
      memberCount: 1,
      assetCount: 0,
    });
    const img = screen.getByTestId('hero-cover-image');
    expect(img.style.objectPosition).toContain('25%');
  });

  it('should show gradient when no thumbnailAssetId', () => {
    render(SpaceHero, {
      space: makeSpace({ thumbnailAssetId: null }),
      memberCount: 1,
      assetCount: 0,
    });
    expect(screen.getByTestId('hero-gradient')).toBeInTheDocument();
    expect(screen.queryByTestId('hero-cover-image')).not.toBeInTheDocument();
  });

  // Task 6: Dual button layout
  it('should show "Set cover photo" button when no cover and onSetCover provided', () => {
    const onSetCover = vi.fn();
    render(SpaceHero, {
      space: makeSpace({ thumbnailAssetId: null }),
      memberCount: 1,
      assetCount: 0,
      onSetCover,
    });
    expect(screen.getByTestId('hero-set-cover-button')).toBeInTheDocument();
    expect(screen.queryByTestId('hero-reposition-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('hero-change-cover-button')).not.toBeInTheDocument();
  });

  it('should show Reposition and Change Cover buttons when cover exists', () => {
    const onSetCover = vi.fn();
    const onReposition = vi.fn();
    render(SpaceHero, {
      space: makeSpace({ thumbnailAssetId: 'asset-1' }),
      memberCount: 1,
      assetCount: 0,
      onSetCover,
      onReposition,
    });
    expect(screen.getByTestId('hero-reposition-button')).toBeInTheDocument();
    expect(screen.getByTestId('hero-change-cover-button')).toBeInTheDocument();
    expect(screen.queryByTestId('hero-set-cover-button')).not.toBeInTheDocument();
  });

  // Task 7: Reposition mode
  it('should show reposition overlay when repositioning is true', () => {
    render(SpaceHero, {
      space: makeSpace({ thumbnailAssetId: 'asset-1' }),
      memberCount: 1,
      assetCount: 0,
      repositioning: true,
      onSavePosition: vi.fn(),
      onCancelReposition: vi.fn(),
    });
    expect(screen.getByTestId('reposition-controls')).toBeInTheDocument();
    expect(screen.getByTestId('reposition-hint')).toBeInTheDocument();
  });

  it('should not show hero buttons during reposition mode', () => {
    render(SpaceHero, {
      space: makeSpace({ thumbnailAssetId: 'asset-1' }),
      memberCount: 1,
      assetCount: 0,
      repositioning: true,
      onSetCover: vi.fn(),
      onReposition: vi.fn(),
      onSavePosition: vi.fn(),
      onCancelReposition: vi.fn(),
    });
    expect(screen.queryByTestId('hero-reposition-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('hero-change-cover-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('hero-set-cover-button')).not.toBeInTheDocument();
  });

  it('should call onSavePosition when Save is clicked', () => {
    const onSavePosition = vi.fn();
    render(SpaceHero, {
      space: makeSpace({ thumbnailAssetId: 'asset-1', thumbnailCropY: 30 }),
      memberCount: 1,
      assetCount: 0,
      repositioning: true,
      onSavePosition,
      onCancelReposition: vi.fn(),
    });
    screen.getByTestId('reposition-save-button').click();
    expect(onSavePosition).toHaveBeenCalledWith(30);
  });

  it('should call onCancelReposition when Cancel is clicked', () => {
    const onCancelReposition = vi.fn();
    render(SpaceHero, {
      space: makeSpace({ thumbnailAssetId: 'asset-1' }),
      memberCount: 1,
      assetCount: 0,
      repositioning: true,
      onSavePosition: vi.fn(),
      onCancelReposition,
    });
    screen.getByTestId('reposition-cancel-button').click();
    expect(onCancelReposition).toHaveBeenCalled();
  });

  it('should show people count chip when faceRecognitionEnabled and peopleCount > 0', () => {
    render(SpaceHero, {
      space: makeSpace(),
      memberCount: 3,
      assetCount: 42,
      faceRecognitionEnabled: true,
      peopleCount: 5,
      spaceId: 'space-1',
    });
    expect(screen.getByTestId('hero-people-count')).toHaveTextContent('5');
  });

  it('should not show people chip when faceRecognitionEnabled is false', () => {
    render(SpaceHero, {
      space: makeSpace(),
      memberCount: 3,
      assetCount: 42,
      faceRecognitionEnabled: false,
      peopleCount: 5,
      spaceId: 'space-1',
    });
    expect(screen.queryByTestId('hero-people-count')).not.toBeInTheDocument();
  });

  it('should not show people chip when peopleCount is 0', () => {
    render(SpaceHero, {
      space: makeSpace(),
      memberCount: 3,
      assetCount: 42,
      faceRecognitionEnabled: true,
      peopleCount: 0,
      spaceId: 'space-1',
    });
    expect(screen.queryByTestId('hero-people-count')).not.toBeInTheDocument();
  });

  it('should link to people sub-route', () => {
    render(SpaceHero, {
      space: makeSpace(),
      memberCount: 3,
      assetCount: 42,
      faceRecognitionEnabled: true,
      peopleCount: 5,
      spaceId: 'space-1',
    });
    const link = screen.getByTestId('hero-people-count');
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe('/spaces/space-1/people');
  });
});
