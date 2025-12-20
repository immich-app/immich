import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import PhotoViewer from '$lib/components/asset-viewer/photo-viewer.svelte';
import * as utils from '$lib/utils';
import { AssetTypeEnum } from '@immich/sdk';
import { assetFactory } from '@test-data/factories/asset-factory';
import { sharedLinkFactory } from '@test-data/factories/shared-link-factory';
import { render } from '@testing-library/svelte';
import type { MockInstance } from 'vitest';

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserver;

vi.mock('$lib/utils', async (originalImport) => {
  const meta = await originalImport<typeof import('$lib/utils')>();
  return {
    ...meta,
    getAssetUrl: vi.fn(),
  };
});

describe('PhotoViewer component', () => {
  let getAssetUrlSpy: MockInstance;

  beforeAll(() => {
    getAssetUrlSpy = vi.spyOn(utils, 'getAssetUrl');

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
    const asset = assetFactory.build({
      originalPath: 'image.jpg',
      originalMimeType: 'image/jpeg',
      type: AssetTypeEnum.Image,
    });
    render(PhotoViewer, { asset });

    expect(getAssetUrlSpy).toBeCalledWith({
      asset,
      sharedLink: undefined,
      forceOriginal: false,
    });
  });

  it('loads the thumbnail image for static gifs', () => {
    const asset = assetFactory.build({
      originalPath: 'image.gif',
      originalMimeType: 'image/gif',
      type: AssetTypeEnum.Image,
    });
    render(PhotoViewer, { asset });

    expect(getAssetUrlSpy).toBeCalledWith({
      asset,
      sharedLink: undefined,
      forceOriginal: false,
    });
  });

  it('loads the thumbnail image for static webp images', () => {
    const asset = assetFactory.build({
      originalPath: 'image.webp',
      originalMimeType: 'image/webp',
      type: AssetTypeEnum.Image,
    });
    render(PhotoViewer, { asset });

    expect(getAssetUrlSpy).toBeCalledWith({
      asset,
      sharedLink: undefined,
      forceOriginal: false,
    });
  });

  it('loads the original image for animated gifs', () => {
    const asset = assetFactory.build({
      originalPath: 'image.gif',
      originalMimeType: 'image/gif',
      type: AssetTypeEnum.Image,
      duration: '2.0',
    });
    render(PhotoViewer, { asset });

    expect(getAssetUrlSpy).toBeCalledWith({
      asset,
      sharedLink: undefined,
      forceOriginal: false,
    });
  });

  it('loads the original image for animated webp images', () => {
    const asset = assetFactory.build({
      originalPath: 'image.webp',
      originalMimeType: 'image/webp',
      type: AssetTypeEnum.Image,
      duration: '2.0',
    });
    render(PhotoViewer, { asset });

    expect(getAssetUrlSpy).toBeCalledWith({
      asset,
      sharedLink: undefined,
      forceOriginal: false,
    });
  });

  it('not loads original static image in shared link even when download permission is true and showMetadata permission is true', () => {
    const asset = assetFactory.build({
      originalPath: 'image.gif',
      originalMimeType: 'image/gif',
      type: AssetTypeEnum.Image,
    });
    const sharedLink = sharedLinkFactory.build({ allowDownload: true, showMetadata: true, assets: [asset] });
    render(PhotoViewer, { asset, sharedLink });

    expect(getAssetUrlSpy).toBeCalledWith({
      asset,
      sharedLink,
      forceOriginal: false,
    });
  });

  it('loads original animated image in shared link when download permission is true and showMetadata permission is true', () => {
    const asset = assetFactory.build({
      originalPath: 'image.gif',
      originalMimeType: 'image/gif',
      type: AssetTypeEnum.Image,
      duration: '2.0',
    });
    const sharedLink = sharedLinkFactory.build({ allowDownload: true, showMetadata: true, assets: [asset] });
    render(PhotoViewer, { asset, sharedLink });

    expect(getAssetUrlSpy).toBeCalledWith({
      asset,
      sharedLink,
      forceOriginal: false,
    });
  });

  it('not loads original animated image when shared link download permission is false', () => {
    const asset = assetFactory.build({
      originalPath: 'image.gif',
      originalMimeType: 'image/gif',
      type: AssetTypeEnum.Image,
      duration: '2.0',
    });
    const sharedLink = sharedLinkFactory.build({ allowDownload: false, assets: [asset] });
    render(PhotoViewer, { asset, sharedLink });

    expect(getAssetUrlSpy).toBeCalledWith({
      asset,
      sharedLink,
      forceOriginal: false,
    });
  });

  it('not loads original animated image when shared link showMetadata permission is false', () => {
    const asset = assetFactory.build({
      originalPath: 'image.gif',
      originalMimeType: 'image/gif',
      type: AssetTypeEnum.Image,
      duration: '2.0',
    });
    const sharedLink = sharedLinkFactory.build({ showMetadata: false, assets: [asset] });
    render(PhotoViewer, { asset, sharedLink });

    expect(getAssetUrlSpy).toBeCalledWith({
      asset,
      sharedLink,
      forceOriginal: false,
    });
  });
});
