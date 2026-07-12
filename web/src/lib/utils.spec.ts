import { AssetTypeEnum } from '@immich/sdk';
import { downloadRequestToFile, downloadUrl, getAssetUrl, semverToName } from '$lib/utils';
import { assetFactory } from '@test-data/factories/asset-factory';
import { sharedLinkFactory } from '@test-data/factories/shared-link-factory';

describe('utils', () => {
  describe(getAssetUrl.name, () => {
    it('should return thumbnail URL for static images', () => {
      const asset = assetFactory.build({
        originalPath: 'image.jpg',
        originalMimeType: 'image/jpeg',
        type: AssetTypeEnum.Image,
      });

      const url = getAssetUrl({ asset });

      // Should return a thumbnail URL (contains /thumbnail)
      expect(url).toContain('/thumbnail');
      expect(url).toContain(asset.id);
    });

    it('should return thumbnail URL for static gifs', () => {
      const asset = assetFactory.build({
        originalPath: 'image.gif',
        originalMimeType: 'image/gif',
        type: AssetTypeEnum.Image,
      });

      const url = getAssetUrl({ asset });

      expect(url).toContain('/thumbnail');
      expect(url).toContain(asset.id);
    });

    it('should return thumbnail URL for static webp images', () => {
      const asset = assetFactory.build({
        originalPath: 'image.webp',
        originalMimeType: 'image/webp',
        type: AssetTypeEnum.Image,
      });

      const url = getAssetUrl({ asset });

      expect(url).toContain('/thumbnail');
      expect(url).toContain(asset.id);
    });

    it('should return original URL for animated gifs', () => {
      const asset = assetFactory.build({
        originalPath: 'image.gif',
        originalMimeType: 'image/gif',
        type: AssetTypeEnum.Image,
        duration: 2000,
      });

      const url = getAssetUrl({ asset });

      // Should return original URL (contains /original)
      expect(url).toContain('/original');
      expect(url).toContain(asset.id);
    });

    it('should return original URL for animated webp images', () => {
      const asset = assetFactory.build({
        originalPath: 'image.webp',
        originalMimeType: 'image/webp',
        type: AssetTypeEnum.Image,
        duration: 2000,
      });

      const url = getAssetUrl({ asset });

      expect(url).toContain('/original');
      expect(url).toContain(asset.id);
    });

    it('should return original URL for video assets with forceOriginal', () => {
      const asset = assetFactory.build({
        originalPath: 'video.mp4',
        originalMimeType: 'video/mp4',
        type: AssetTypeEnum.Video,
      });

      const url = getAssetUrl({ asset, forceOriginal: true });

      expect(url).toContain('/original');
      expect(url).toContain(asset.id);
    });

    it('should return thumbnail URL for video assets without forceOriginal', () => {
      const asset = assetFactory.build({
        originalPath: 'video.mp4',
        originalMimeType: 'video/mp4',
        type: AssetTypeEnum.Video,
      });

      const url = getAssetUrl({ asset });

      expect(url).toContain('/thumbnail');
      expect(url).toContain(asset.id);
    });

    it('should return thumbnail URL for static images in shared link even with download and showMetadata permissions', () => {
      const asset = assetFactory.build({
        originalPath: 'image.gif',
        originalMimeType: 'image/gif',
        type: AssetTypeEnum.Image,
      });
      const sharedLink = sharedLinkFactory.build({ allowDownload: true, showMetadata: true, assets: [asset] });

      const url = getAssetUrl({ asset, sharedLink });

      expect(url).toContain('/thumbnail');
      expect(url).toContain(asset.id);
    });

    it('should return original URL for animated images in shared link with download and showMetadata permissions', () => {
      const asset = assetFactory.build({
        originalPath: 'image.gif',
        originalMimeType: 'image/gif',
        type: AssetTypeEnum.Image,
        duration: 2000,
      });
      const sharedLink = sharedLinkFactory.build({ allowDownload: true, showMetadata: true, assets: [asset] });

      const url = getAssetUrl({ asset, sharedLink });

      expect(url).toContain('/original');
      expect(url).toContain(asset.id);
    });

    it('should return thumbnail URL (not original) for animated images when shared link download permission is false', () => {
      const asset = assetFactory.build({
        originalPath: 'image.gif',
        originalMimeType: 'image/gif',
        type: AssetTypeEnum.Image,
        duration: 2000,
      });
      const sharedLink = sharedLinkFactory.build({ allowDownload: false, assets: [asset] });

      const url = getAssetUrl({ asset, sharedLink });

      expect(url).toContain('/thumbnail');
      expect(url).not.toContain('/original');
      expect(url).toContain(asset.id);
    });

    it('should return thumbnail URL (not original) for animated images when shared link showMetadata permission is false', () => {
      const asset = assetFactory.build({
        originalPath: 'image.gif',
        originalMimeType: 'image/gif',
        type: AssetTypeEnum.Image,
        duration: 2000,
      });
      const sharedLink = sharedLinkFactory.build({ showMetadata: false, assets: [asset] });

      const url = getAssetUrl({ asset, sharedLink });

      expect(url).toContain('/thumbnail');
      expect(url).not.toContain('/original');
      expect(url).toContain(asset.id);
    });
  });
  describe('semverToName', () => {
    it('should not append release candidate tag if prelease is not set', () => {
      expect(semverToName({ major: 3, minor: 0, patch: 0, prerelease: null })).toEqual('v3.0.0');
    });

    it('should append release candidate if set', () => {
      expect(semverToName({ major: 3, minor: 0, patch: 0, prerelease: 0 })).toEqual('v3.0.0-rc.0');
    });
  });

  describe(downloadUrl.name, () => {
    const revokeObjectURLMock = vi.fn();

    beforeAll(() => {
      Object.defineProperty(URL, 'revokeObjectURL', { writable: true, value: revokeObjectURLMock });
    });

    beforeEach(() => {
      revokeObjectURLMock.mockClear();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should defer revoking blob urls until after the download has started', () => {
      downloadUrl('blob:https://immich.test/some-id', 'archive.zip');

      expect(revokeObjectURLMock).not.toHaveBeenCalled();

      vi.runAllTimers();

      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:https://immich.test/some-id');
    });

    it('should not revoke non-blob urls', () => {
      downloadUrl('https://immich.test/api/assets/id/original', 'photo.jpg');

      vi.runAllTimers();

      expect(revokeObjectURLMock).not.toHaveBeenCalled();
    });
  });

  describe(downloadRequestToFile.name, () => {
    const expectedFile = new File([new Uint8Array([1, 2, 3, 4, 5])], 'archive.zip');
    const writable = {
      write: vi.fn(() => Promise.resolve()),
      close: vi.fn(() => Promise.resolve()),
      abort: vi.fn(() => Promise.resolve()),
    };
    const fileHandle = { createWritable: vi.fn(() => Promise.resolve(writable)), getFile: () => expectedFile };
    const directory = {
      async *keys() {},
      getFileHandle: vi.fn(() => Promise.resolve(fileHandle)),
      removeEntry: vi.fn(() => Promise.resolve()),
    };
    const root = { getDirectoryHandle: vi.fn(() => Promise.resolve(directory)) };

    class FileSystemFileHandleMock {
      createWritable() {}
    }

    beforeEach(() => {
      vi.clearAllMocks();
      vi.stubGlobal('FileSystemFileHandle', FileSystemFileHandleMock);
      Object.defineProperty(navigator, 'storage', {
        configurable: true,
        value: { getDirectory: () => Promise.resolve(root) },
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      Object.defineProperty(navigator, 'storage', { configurable: true, value: undefined });
    });

    it('should return null when the file system APIs are not available', async () => {
      Object.defineProperty(navigator, 'storage', { configurable: true, value: undefined });

      await expect(downloadRequestToFile({ url: 'https://immich.test/api/download/archive' })).resolves.toBeNull();
    });

    it('should stream the response to a disk-backed file', async () => {
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.enqueue(new Uint8Array([4, 5]));
          controller.close();
        },
      });
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve(new Response(body, { status: 200 }))),
      );
      const onDownloadProgress = vi.fn();

      const file = await downloadRequestToFile({
        method: 'POST',
        url: 'https://immich.test/api/download/archive',
        data: { assetIds: ['asset-id'] },
        onDownloadProgress,
      });

      expect(file).toBe(expectedFile);
      expect(writable.write).toHaveBeenCalledTimes(2);
      expect(writable.close).toHaveBeenCalled();
      expect(onDownloadProgress).toHaveBeenLastCalledWith(expect.objectContaining({ loaded: 5 }));
      expect(directory.removeEntry).not.toHaveBeenCalled();
    });

    it('should remove the temporary file when the request fails', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve(new Response('error', { status: 500 }))),
      );

      await expect(downloadRequestToFile({ url: 'https://immich.test/api/download/archive' })).rejects.toThrow();

      expect(writable.abort).toHaveBeenCalled();
      expect(directory.removeEntry).toHaveBeenCalled();
    });
  });
});
