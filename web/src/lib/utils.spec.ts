import en from '#i18n/en.json';
import { getAssetUrl, memoryLaneTitle, semverToName } from '#lib/utils.ts';
import { validThumbhash } from '#test/common/factories.ts';
import { factory } from '#test/unit/factories.ts';
import { AssetTypeEnum, MemoryType, type MemoryResponseDto } from '@immich/sdk';
import { addMessages, init } from 'svelte-i18n';
import { get } from 'svelte/store';

describe('utils', () => {
  describe(getAssetUrl.name, () => {
    const image = { originalPath: 'image.jpg', originalMimeType: 'image/jpeg', type: AssetTypeEnum.Image };
    const gif = { originalPath: 'image.gif', originalMimeType: 'image/gif', type: AssetTypeEnum.Image };
    const animatedGif = { ...gif, duration: 2000 };
    const animatedWebp = {
      originalPath: 'image.webp',
      originalMimeType: 'image/webp',
      type: AssetTypeEnum.Image,
      duration: 2000,
    };
    const video = { originalPath: 'video.mp4', originalMimeType: 'video/mp4', type: AssetTypeEnum.Video };
    const preview = (id: string) => `/api/assets/${id}/thumbnail?size=preview&c=${validThumbhash}&edited=true`;
    const original = (id: string) => `/api/assets/${id}/original?c=${validThumbhash}&edited=true`;

    it.each([
      { name: 'a static image', overrides: image, expected: preview },
      { name: 'a static gif', overrides: gif, expected: preview },
      { name: 'a static webp', overrides: { ...animatedWebp, duration: undefined }, expected: preview },
      { name: 'an animated gif', overrides: animatedGif, expected: original },
      { name: 'an animated webp', overrides: animatedWebp, expected: original },
      { name: 'a video', overrides: video, expected: preview },
    ])('serves the preview or the original for $name', ({ overrides, expected }) => {
      const asset = factory.asset(overrides);

      expect(getAssetUrl({ asset })).toBe(expected(asset.id));
    });

    it('serves the original for a video when forced', () => {
      const asset = factory.asset(video);

      expect(getAssetUrl({ asset, forceOriginal: true })).toBe(original(asset.id));
    });

    it.each([
      { name: 'a static image with download and metadata allowed', overrides: gif, link: {}, expected: preview },
      {
        name: 'an animated gif with download and metadata allowed',
        overrides: animatedGif,
        link: {},
        expected: original,
      },
      {
        name: 'an animated gif when download is not allowed',
        overrides: animatedGif,
        link: { allowDownload: false },
        expected: preview,
      },
      {
        name: 'an animated gif when metadata is hidden',
        overrides: animatedGif,
        link: { showMetadata: false },
        expected: preview,
      },
    ])('on a shared link serves the preview or the original for $name', ({ overrides, link, expected }) => {
      const asset = factory.asset(overrides);
      const sharedLink = factory.sharedLink({ ...link, assets: [asset] });

      expect(getAssetUrl({ asset, sharedLink })).toBe(expected(asset.id));
    });
  });

  describe('semverToName', () => {
    it('should not append release candidate tag if prelease is not set', () => {
      expect(semverToName({ major: 3, minor: 0, patch: 0, prerelease: null, featureLevel: 1 })).toEqual('v3.0.0');
    });

    it('should append release candidate if set', () => {
      expect(semverToName({ major: 3, minor: 0, patch: 0, prerelease: 0, featureLevel: 1 })).toEqual('v3.0.0-rc.0');
    });
  });

  describe('memoryLaneTitle', () => {
    beforeAll(async () => {
      addMessages('en', en);
      await init({ fallbackLocale: 'en', initialLocale: 'en' });
    });

    const birthday = (data: Partial<MemoryResponseDto['data']>, memoryAt = '2026-09-22T00:00:00.000Z') =>
      get(memoryLaneTitle)({
        type: MemoryType.Birthday,
        memoryAt,
        data: { year: 1990, personName: 'Alex', ...data },
      } as MemoryResponseDto);

    it('should name the person whose birthday it is', () => {
      expect(birthday({ year: 1990 })).toBe("Alex's birthday");
    });

    it('should not depend on the age, which the viewer shows per photo', () => {
      expect(birthday({ year: 2025 })).toBe("Alex's birthday");
      expect(birthday({ year: 2026 }, '2027-01-04T00:00:00.000Z')).toBe("Alex's birthday");
    });

    it('should fall back when the person has no name', () => {
      expect(birthday({ personName: undefined })).toBe('Unknown');
    });
  });
});
