import type { Faces } from '$lib/stores/people.store';
import type { Size } from '$lib/utils/container-utils';
import { getBoundingBox, sortPeopleForManagement, zoomImageToBase64 } from '$lib/utils/people-utils';
import { AssetTypeEnum } from '@immich/sdk';

const makeFace = (overrides: Partial<Faces> = {}): Faces => ({
  id: 'face-1',
  imageWidth: 4000,
  imageHeight: 3000,
  boundingBoxX1: 1000,
  boundingBoxY1: 750,
  boundingBoxX2: 2000,
  boundingBoxY2: 1500,
  ...overrides,
});

describe('sortPeopleForManagement', () => {
  const p = (overrides: {
    id: string;
    name?: string | null;
    isFavorite?: boolean;
    numberOfAssets?: number;
    assetCount?: number;
    isHidden?: boolean;
  }) => overrides;

  it('sorts favorites first, named people alphabetically, then unnamed by count descending', () => {
    const people = [
      p({ id: 'unnamed-low', name: '', numberOfAssets: 1 }),
      p({ id: 'named-z', name: 'Zoe', numberOfAssets: 99 }),
      p({ id: 'favorite-unnamed-high', name: '', isFavorite: true, numberOfAssets: 10 }),
      p({ id: 'named-a', name: 'Alice', numberOfAssets: 1 }),
      p({ id: 'unnamed-high', name: '', numberOfAssets: 50 }),
      p({ id: 'favorite-named', name: 'Beth', isFavorite: true, numberOfAssets: 1 }),
    ];

    expect(sortPeopleForManagement(people).map((person) => person.id)).toEqual([
      'favorite-named',
      'favorite-unnamed-high',
      'named-a',
      'named-z',
      'unnamed-high',
      'unnamed-low',
    ]);
  });

  it('treats whitespace-only names as unnamed and uses assetCount for space people', () => {
    const people = [
      p({ id: 'space-unnamed-low', name: '   ', assetCount: 2 }),
      p({ id: 'space-named', name: 'anna', assetCount: 1 }),
      p({ id: 'space-unnamed-high', name: '', assetCount: 9 }),
    ];

    expect(sortPeopleForManagement(people).map((person) => person.id)).toEqual([
      'space-named',
      'space-unnamed-high',
      'space-unnamed-low',
    ]);
  });

  it('uses case-insensitive names, missing counts as zero, and id as final tiebreak', () => {
    const people = [
      p({ id: 'unnamed-b', name: '', numberOfAssets: undefined }),
      p({ id: 'named-b', name: 'bob' }),
      p({ id: 'unnamed-a', name: '', numberOfAssets: 0 }),
      p({ id: 'named-a', name: 'Alice' }),
    ];

    expect(sortPeopleForManagement(people).map((person) => person.id)).toEqual([
      'named-a',
      'named-b',
      'unnamed-a',
      'unnamed-b',
    ]);
  });
});

describe('getBoundingBox', () => {
  it('should scale face coordinates to display dimensions', () => {
    const face = makeFace();
    const imageSize: Size = { width: 800, height: 600 };

    const boxes = getBoundingBox([face], imageSize);

    expect(boxes).toHaveLength(1);
    expect(boxes[0]).toEqual({
      id: 'face-1',
      top: 600 * (750 / 3000),
      left: 800 * (1000 / 4000),
      width: 800 * (2000 / 4000) - 800 * (1000 / 4000),
      height: 600 * (1500 / 3000) - 600 * (750 / 3000),
    });
  });

  it('should map full-image face to full display area', () => {
    const face = makeFace({
      imageWidth: 1000,
      imageHeight: 1000,
      boundingBoxX1: 0,
      boundingBoxY1: 0,
      boundingBoxX2: 1000,
      boundingBoxY2: 1000,
    });
    const imageSize: Size = { width: 600, height: 600 };

    const boxes = getBoundingBox([face], imageSize);

    expect(boxes[0]).toEqual({
      id: 'face-1',
      top: 0,
      left: 0,
      width: 600,
      height: 600,
    });
  });

  it('should return empty array for empty faces', () => {
    expect(getBoundingBox([], { width: 800, height: 600 })).toEqual([]);
  });

  it('should handle multiple faces', () => {
    const faces = [
      makeFace({ id: 'face-1', boundingBoxX1: 0, boundingBoxY1: 0, boundingBoxX2: 1000, boundingBoxY2: 1000 }),
      makeFace({ id: 'face-2', boundingBoxX1: 2000, boundingBoxY1: 1500, boundingBoxX2: 3000, boundingBoxY2: 2500 }),
    ];

    const boxes = getBoundingBox(faces, { width: 800, height: 600 });

    expect(boxes).toHaveLength(2);
    expect(boxes[0].left).toBeLessThan(boxes[1].left);
  });
});

describe(zoomImageToBase64.name, () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('sets anonymous CORS before loading video thumbnails and face crop images', async () => {
    const operations: Array<{ imageIndex: number; type: 'crossOrigin' | 'src'; value: string | null }> = [];
    let imageCount = 0;

    class TestImage extends EventTarget {
      readonly imageIndex = imageCount++;
      naturalWidth = 4000;
      naturalHeight = 3000;
      private source = '';

      set crossOrigin(value: string | null) {
        operations.push({ imageIndex: this.imageIndex, type: 'crossOrigin', value });
      }

      get crossOrigin() {
        return 'anonymous';
      }

      set src(value: string) {
        this.source = value;
        operations.push({ imageIndex: this.imageIndex, type: 'src', value });
      }

      get src() {
        return this.source;
      }

      override addEventListener(...args: Parameters<EventTarget['addEventListener']>) {
        super.addEventListener(...args);

        if (args[0] === 'load') {
          queueMicrotask(() => this.dispatchEvent(new Event('load')));
        }
      }
    }

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => ({ drawImage: vi.fn() })),
          toDataURL: vi.fn(() => 'data:image/png;base64,face'),
        } as unknown as HTMLCanvasElement;
      }

      return originalCreateElement(tagName);
    }) as typeof document.createElement);

    vi.stubGlobal('Image', TestImage);

    await expect(zoomImageToBase64(makeFace(), 'asset-1', AssetTypeEnum.Video, undefined)).resolves.toBe(
      'data:image/png;base64,face',
    );

    for (const imageIndex of [0, 1]) {
      const crossOriginIndex = operations.findIndex(
        (operation) => operation.imageIndex === imageIndex && operation.type === 'crossOrigin',
      );
      const srcIndex = operations.findIndex(
        (operation) => operation.imageIndex === imageIndex && operation.type === 'src',
      );

      expect(crossOriginIndex).toBeGreaterThanOrEqual(0);
      expect(crossOriginIndex).toBeLessThan(srcIndex);
      expect(operations[crossOriginIndex].value).toBe('anonymous');
    }
  });
});
