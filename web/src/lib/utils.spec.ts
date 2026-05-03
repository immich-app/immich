import { getAssetMediaUrl, getAssetUrl, getMemoryTitle, getReleaseType } from '$lib/utils';
import { AssetMediaSize, AssetTypeEnum, MemoryType, type MemoryResponseDto } from '@immich/sdk';
import { assetFactory } from '@test-data/factories/asset-factory';
import { sharedLinkFactory } from '@test-data/factories/shared-link-factory';

describe('utils', () => {
  describe(getAssetMediaUrl.name, () => {
    it('adds download=true to original media URLs when requested', () => {
      const url = getAssetMediaUrl({
        id: 'asset-1',
        size: AssetMediaSize.Original,
        edited: false,
        cacheKey: 'cache-1',
        download: true,
      });

      expect(url).toContain('/api/assets/asset-1/original');
      expect(url).toContain('download=true');
      expect(url).toContain('edited=false');
      expect(url).toContain('c=cache-1');
    });

    it('does not add download=true to thumbnail media URLs', () => {
      const url = getAssetMediaUrl({
        id: 'asset-1',
        size: AssetMediaSize.Thumbnail,
        download: true,
      });

      expect(url).toContain('/api/assets/asset-1/thumbnail');
      expect(url).not.toContain('download=true');
    });
  });

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
        duration: '2.0',
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
        duration: '2.0',
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
        duration: '2.0',
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
        duration: '2.0',
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
        duration: '2.0',
      });
      const sharedLink = sharedLinkFactory.build({ showMetadata: false, assets: [asset] });

      const url = getAssetUrl({ asset, sharedLink });

      expect(url).toContain('/thumbnail');
      expect(url).not.toContain('/original');
      expect(url).toContain(asset.id);
    });
  });

  describe(getReleaseType.name, () => {
    it('should return "major" for major version changes', () => {
      expect(getReleaseType({ major: 1, minor: 0, patch: 0 }, { major: 2, minor: 0, patch: 0 })).toBe('major');
      expect(getReleaseType({ major: 1, minor: 0, patch: 0 }, { major: 3, minor: 2, patch: 1 })).toBe('major');
    });

    it('should return "minor" for minor version changes', () => {
      expect(getReleaseType({ major: 1, minor: 0, patch: 0 }, { major: 1, minor: 1, patch: 0 })).toBe('minor');
      expect(getReleaseType({ major: 1, minor: 0, patch: 0 }, { major: 1, minor: 2, patch: 1 })).toBe('minor');
    });

    it('should return "patch" for patch version changes', () => {
      expect(getReleaseType({ major: 1, minor: 0, patch: 0 }, { major: 1, minor: 0, patch: 1 })).toBe('patch');
      expect(getReleaseType({ major: 1, minor: 0, patch: 0 }, { major: 1, minor: 0, patch: 5 })).toBe('patch');
    });

    it('should return "none" for matching versions', () => {
      expect(getReleaseType({ major: 1, minor: 0, patch: 0 }, { major: 1, minor: 0, patch: 0 })).toBe('none');
      expect(getReleaseType({ major: 1, minor: 2, patch: 3 }, { major: 1, minor: 2, patch: 3 })).toBe('none');
    });
  });

  describe(getMemoryTitle.name, () => {
    const translate = ((key: string, payload?: { values?: Record<string, number> }) => {
      if (key === 'years_ago') {
        return `${payload?.values?.years} years ago`;
      }

      return key;
    }) as unknown as Parameters<typeof getMemoryTitle>[1];
    const memory = (overrides: Partial<MemoryResponseDto>): MemoryResponseDto => ({
      assets: [],
      createdAt: '2026-04-23T00:00:00Z',
      data: {},
      id: 'memory-id',
      isSaved: false,
      memoryAt: '2026-04-23T00:00:00Z',
      ownerId: 'owner-id',
      type: MemoryType.Rule,
      updatedAt: '2026-04-23T00:00:00Z',
      ...overrides,
    });

    it('prefers a server-supplied title when present', () => {
      expect(
        getMemoryTitle(
          memory({
            type: MemoryType.Rule,
            title: 'Happy birthday, Alice',
            data: { title: 'Happy birthday, Alice' },
          }),
          translate,
          new Date('2026-04-23T00:00:00Z'),
        ),
      ).toBe('Happy birthday, Alice');
    });

    it('falls back to the localized on-this-day title when no server title exists', () => {
      expect(
        getMemoryTitle(
          memory({
            type: MemoryType.OnThisDay,
            data: { year: 2024 },
          }),
          translate,
          new Date('2026-04-23T00:00:00Z'),
        ),
      ).toBe('2 years ago');
    });
  });
});
