import { getAnimateMock } from '$lib/__mocks__/animate.mock';
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
    vi.stubGlobal('cast', {
      framework: {
        CastState: {
          NO_DEVICES_AVAILABLE: 'NO_DEVICES_AVAILABLE',
        },
        RemotePlayer: vi.fn().mockImplementation(() => ({})),
        RemotePlayerEventType: {
          ANY_CHANGE: 'anyChanged',
        },
        RemotePlayerController: vi.fn().mockImplementation(() => ({ addEventListener: vi.fn() })),
        CastContext: {
          getInstance: vi.fn().mockImplementation(() => ({ setOptions: vi.fn(), addEventListener: vi.fn() })),
        },
        CastContextEventType: {
          SESSION_STATE_CHANGED: 'sessionstatechanged',
          CAST_STATE_CHANGED: 'caststatechanged',
        },
      },
    });
    vi.stubGlobal('chrome', {
      cast: { media: { PlayerState: { IDLE: 'IDLE' } }, AutoJoinPolicy: { ORIGIN_SCOPED: 'origin_scoped' } },
    });
  });

  beforeEach(() => {
    Element.prototype.animate = getAnimateMock();
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
