import SpaceCollage from '$lib/components/spaces/space-collage.svelte';
import { render, screen } from '@testing-library/svelte';

const makeAsset = (id: string, thumbhash: string | null = null) => ({ id, thumbhash });

describe('SpaceCollage component', () => {
  it('should render gradient placeholder for 0 assets', () => {
    render(SpaceCollage, { assets: [], gradientClass: 'from-blue-400 to-blue-600' });
    expect(screen.getByTestId('collage-empty')).toBeInTheDocument();
  });

  it('should render single image layout for 1 asset', () => {
    const { container } = render(SpaceCollage, { assets: [makeAsset('a1')] });
    expect(screen.getByTestId('collage-single')).toBeInTheDocument();
    const imgs = container.querySelectorAll('img');
    expect(imgs).toHaveLength(1);
    expect(imgs[0].getAttribute('src')).toContain('a1');
  });

  it('should render asymmetric layout for 2 assets', () => {
    const { container } = render(SpaceCollage, { assets: [makeAsset('a1'), makeAsset('a2')] });
    expect(screen.getByTestId('collage-asymmetric')).toBeInTheDocument();
    const imgs = container.querySelectorAll('img');
    expect(imgs).toHaveLength(2);
  });

  it('should render asymmetric layout for 3 assets', () => {
    const { container } = render(SpaceCollage, { assets: [makeAsset('a1'), makeAsset('a2'), makeAsset('a3')] });
    expect(screen.getByTestId('collage-asymmetric')).toBeInTheDocument();
    const imgs = container.querySelectorAll('img');
    expect(imgs).toHaveLength(3);
  });

  it('should render 2x2 grid layout for 4 assets', () => {
    const { container } = render(SpaceCollage, {
      assets: [makeAsset('a1'), makeAsset('a2'), makeAsset('a3'), makeAsset('a4')],
    });
    expect(screen.getByTestId('collage-grid')).toBeInTheDocument();
    const imgs = container.querySelectorAll('img');
    expect(imgs).toHaveLength(4);
  });

  it('should render 2x2 grid with only first 4 for 5+ assets', () => {
    const { container } = render(SpaceCollage, {
      assets: [makeAsset('a1'), makeAsset('a2'), makeAsset('a3'), makeAsset('a4'), makeAsset('a5')],
    });
    expect(screen.getByTestId('collage-grid')).toBeInTheDocument();
    const imgs = container.querySelectorAll('img');
    expect(imgs).toHaveLength(4);
  });

  it('should use eager loading when preload is true', () => {
    const { container } = render(SpaceCollage, { assets: [makeAsset('a1')], preload: true });
    const img = container.querySelector('img');
    expect(img?.getAttribute('loading')).toBe('eager');
  });

  it('should use lazy loading by default', () => {
    const { container } = render(SpaceCollage, { assets: [makeAsset('a1')] });
    const img = container.querySelector('img');
    expect(img?.getAttribute('loading')).toBe('lazy');
  });
});
