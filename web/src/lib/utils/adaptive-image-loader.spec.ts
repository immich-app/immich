import { AdaptiveImageLoader, type QualityList } from '#lib/utils/adaptive-image-loader.svelte.ts';

function createQualityList(overrides?: {
  onAfterLoad?: Record<string, (loader: AdaptiveImageLoader) => void>;
  onAfterError?: Record<string, (loader: AdaptiveImageLoader) => void>;
}): QualityList {
  return [
    {
      quality: 'thumbnail',
      url: '/thumbnail.jpg',
      onAfterLoad: overrides?.onAfterLoad?.thumbnail,
      onAfterError: overrides?.onAfterError?.thumbnail,
    },
    {
      quality: 'preview',
      url: '/preview.jpg',
      onAfterLoad: overrides?.onAfterLoad?.preview,
      onAfterError: overrides?.onAfterError?.preview,
    },
    {
      quality: 'original',
      url: '/original.jpg',
      onAfterLoad: overrides?.onAfterLoad?.original,
      onAfterError: overrides?.onAfterError?.original,
    },
  ];
}

describe('AdaptiveImageLoader', () => {
  it('thumbnail load triggers preview via onAfterLoad', () => {
    const triggerSpy = vi.fn();
    const qualityList = createQualityList({
      onAfterLoad: {
        thumbnail: (loader) => {
          triggerSpy();
          loader.trigger('preview');
        },
      },
    });
    const loader = new AdaptiveImageLoader(qualityList);

    loader.onLoad('thumbnail');

    expect(triggerSpy).toHaveBeenCalledOnce();
    expect(loader.status.urls.preview).toBe('/preview.jpg');
  });

  it('thumbnail error triggers preview via onAfterError', () => {
    const qualityList = createQualityList({
      onAfterError: {
        thumbnail: (loader) => loader.trigger('preview'),
      },
    });
    const loader = new AdaptiveImageLoader(qualityList);

    loader.onError('thumbnail');

    expect(loader.status.urls.preview).toBe('/preview.jpg');
  });
});
