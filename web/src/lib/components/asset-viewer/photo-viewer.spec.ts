import PhotoViewer from '$lib/components/asset-viewer/photo-viewer.svelte';
import * as utils from '$lib/utils';
import { AssetMediaSize } from '@immich/sdk';
import { assetFactory } from '@test-data/factories/asset-factory';
import { sharedLinkFactory } from '@test-data/factories/shared-link-factory';
import { render } from '@testing-library/svelte';
import type { MockInstance } from 'vitest';

vi.mock('$lib/utils', async (originalImport) => {
  const meta = await originalImport<typeof import('$lib/utils')>();
  return {
    ...meta,
    getAssetOriginalUrl: vi.fn(),
    getAssetThumbnailUrl: vi.fn(),
  };
});

describe('PhotoViewer component', () => {
  let getAssetOriginalUrlSpy: MockInstance;
  let getAssetThumbnailUrlSpy: MockInstance;

  beforeAll(() => {
    getAssetOriginalUrlSpy = vi.spyOn(utils, 'getAssetOriginalUrl');
    getAssetThumbnailUrlSpy = vi.spyOn(utils, 'getAssetThumbnailUrl');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('loads the thumbnail', () => {
    const asset = assetFactory.build({ originalPath: 'image.jpg', originalMimeType: 'image/jpeg' });
    render(PhotoViewer, { asset });

    expect(getAssetThumbnailUrlSpy).toBeCalledWith({
      id: asset.id,
      size: AssetMediaSize.Preview,
      checksum: asset.checksum,
    });
    expect(getAssetOriginalUrlSpy).not.toBeCalled();
  });

  it('loads the original image for gifs', () => {
    const asset = assetFactory.build({ originalPath: 'image.gif', originalMimeType: 'image/gif' });
    render(PhotoViewer, { asset });

    expect(getAssetThumbnailUrlSpy).not.toBeCalled();
    expect(getAssetOriginalUrlSpy).toBeCalledWith({ id: asset.id, checksum: asset.checksum });
  });

  it('loads original for shared link when download permission is true and showMetadata permission is true', () => {
    const asset = assetFactory.build({ originalPath: 'image.gif', originalMimeType: 'image/gif' });
    const sharedLink = sharedLinkFactory.build({ allowDownload: true, showMetadata: true, assets: [asset] });
    render(PhotoViewer, { asset, sharedLink });

    expect(getAssetThumbnailUrlSpy).not.toBeCalled();
    expect(getAssetOriginalUrlSpy).toBeCalledWith({ id: asset.id, checksum: asset.checksum });
  });

  it('not loads original image when shared link download permission is false', () => {
    const asset = assetFactory.build({ originalPath: 'image.gif', originalMimeType: 'image/gif' });
    const sharedLink = sharedLinkFactory.build({ allowDownload: false, assets: [asset] });
    render(PhotoViewer, { asset, sharedLink });

    expect(getAssetThumbnailUrlSpy).toBeCalledWith({
      id: asset.id,
      size: AssetMediaSize.Preview,
      checksum: asset.checksum,
    });

    expect(getAssetOriginalUrlSpy).not.toBeCalled();
  });

  it('not loads original image when shared link showMetadata permission is false', () => {
    const asset = assetFactory.build({ originalPath: 'image.gif', originalMimeType: 'image/gif' });
    const sharedLink = sharedLinkFactory.build({ showMetadata: false, assets: [asset] });
    render(PhotoViewer, { asset, sharedLink });

    expect(getAssetThumbnailUrlSpy).toBeCalledWith({
      id: asset.id,
      size: AssetMediaSize.Preview,
      checksum: asset.checksum,
    });

    expect(getAssetOriginalUrlSpy).not.toBeCalled();
  });
});
