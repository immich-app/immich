import { AssetTypeEnum } from '@immich/sdk';
import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import AdaptiveImage from '$lib/components/AdaptiveImage.svelte';
import { assetFactory } from '@test-data/factories/asset-factory';

vi.mock('$lib/utils/sw-messaging', () => ({
  cancelImageUrl: vi.fn(),
}));

const setNaturalSize = (img: HTMLImageElement, width: number, height: number) => {
  Object.defineProperties(img, {
    naturalWidth: { value: width, configurable: true },
    naturalHeight: { value: height, configurable: true },
  });
};

const getDisplayBox = (baseElement: Element) =>
  baseElement.querySelector<HTMLDivElement>('[style*="inset-inline-start"]');

const pixels = (value: string) => Number(value.replace('px', ''));

describe('AdaptiveImage', () => {
  it('lays the image out with the aspect ratio of the loaded pixels, not the metadata dimensions', async () => {
    const asset = assetFactory.build({ type: AssetTypeEnum.Image, width: 3872, height: 2592 });

    const { baseElement } = render(AdaptiveImage, {
      asset,
      container: { width: 1000, height: 1000 },
    });

    const thumbnail = baseElement.querySelector<HTMLImageElement>('img[data-testid="thumbnail"]');
    expect(thumbnail).not.toBeNull();

    setNaturalSize(thumbnail!, 2592, 3872);
    await fireEvent.load(thumbnail!);
    await tick();

    const box = getDisplayBox(baseElement);
    expect(box).not.toBeNull();

    const width = pixels(box!.style.width);
    const height = pixels(box!.style.height);
    expect(width).toBeLessThan(height);
  });
});
