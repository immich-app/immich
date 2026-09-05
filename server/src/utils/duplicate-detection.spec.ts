import {
  DuplicateMetadataAsset,
  getMetadataCandidatePrefixes,
  getPixelCaptureKey,
  isCameraRaw,
  isMetadataDuplicate,
  isRenderedImage,
} from 'src/utils/duplicate-detection';
import { describe, expect, it } from 'vitest';

const createAsset = (values: Partial<DuplicateMetadataAsset> = {}): DuplicateMetadataAsset => ({
  originalFileName: 'IMG_0001.jpg',
  originalPath: '/library/IMG_0001.jpg',
  dateTimeOriginal: new Date('2026-01-20T12:00:00.000Z'),
  make: 'Google',
  model: 'Pixel 10 Pro',
  autoStackId: null,
  ...values,
});

describe('duplicate detection utils', () => {
  describe('file types', () => {
    it.each(['photo.dng', 'photo.cr3', 'photo.nef', 'photo.arw'])('recognizes %s as camera RAW', (filename) => {
      expect(isCameraRaw(filename)).toBe(true);
    });

    it('does not recognize PSD as camera RAW', () => {
      expect(isCameraRaw('photo.psd')).toBe(false);
    });

    it.each(['photo.jpg', 'photo.jpeg', 'photo.jpe', 'photo.heic', 'photo.heif'])(
      'recognizes %s as a rendered image',
      (filename) => {
        expect(isRenderedImage(filename)).toBe(true);
      },
    );
  });

  describe('Pixel capture key', () => {
    it.each([
      'PXL_20260121_195958829.RAW-01.COVER.jpg',
      'PXL_20260121_195958829.RAW-02.ORIGINAL.dng',
      'PXL_20260121_195958829.NIGHT.jpg',
      'PXL_20260121_195958829.jpg',
    ])('extracts the capture key from %s', (filename) => {
      expect(getPixelCaptureKey(filename)).toBe('pxl_20260121_195958829');
    });

    it('does not treat arbitrary filenames as Pixel capture keys', () => {
      expect(getPixelCaptureKey('IMG_20260121_195958829.jpg')).toBeNull();
    });
  });

  describe('candidate prefixes', () => {
    it('returns the capture name for RAW and rendered files', () => {
      expect(getMetadataCandidatePrefixes(createAsset())).toEqual(['IMG_0001']);
    });

    it('returns both names for Pixel multi-file captures', () => {
      expect(
        getMetadataCandidatePrefixes(createAsset({ originalFileName: 'PXL_20260121_195958829.RAW-01.COVER.jpg' })),
      ).toEqual(['PXL_20260121_195958829.RAW-01.COVER', 'pxl_20260121_195958829']);
    });
  });

  describe('metadata matches', () => {
    it('matches assets with the same auto stack ID', () => {
      const first = createAsset({ autoStackId: 'burst-id' });
      const second = createAsset({ originalFileName: 'IMG_0002.jpg', autoStackId: 'burst-id' });

      expect(isMetadataDuplicate(first, second)).toBe(true);
    });

    it('rejects auto stack matches outside the time window', () => {
      const first = createAsset({ autoStackId: 'burst-id' });
      const second = createAsset({
        originalFileName: 'IMG_0002.jpg',
        autoStackId: 'burst-id',
        dateTimeOriginal: new Date('2026-01-20T12:01:01.000Z'),
      });

      expect(isMetadataDuplicate(first, second)).toBe(false);
    });

    it('rejects matching IDs when device metadata conflicts', () => {
      const first = createAsset({ autoStackId: 'burst-id' });
      const second = createAsset({ autoStackId: 'burst-id', make: 'Apple', model: 'iPhone 17' });

      expect(isMetadataDuplicate(first, second)).toBe(false);
    });

    it('matches same-name RAW and rendered files from the same camera', () => {
      const first = createAsset({ originalFileName: 'IMG_0001.DNG' });
      const second = createAsset({ originalFileName: 'img_0001.jpg' });

      expect(isMetadataDuplicate(first, second)).toBe(true);
    });

    it('matches same-name RAW and rendered files across a direct RAW subdirectory', () => {
      const first = createAsset({
        originalFileName: 'IMG_0001.cr3',
        originalPath: '/library/RAW/IMG_0001.cr3',
        make: null,
        model: null,
      });
      const second = createAsset({ make: null, model: null });

      expect(isMetadataDuplicate(first, second)).toBe(true);
    });

    it('rejects same-name RAW and rendered files without a camera or path relationship', () => {
      const first = createAsset({
        originalFileName: 'IMG_0001.dng',
        originalPath: '/imports/IMG_0001.dng',
        make: null,
        model: null,
      });
      const second = createAsset({ originalPath: '/library/IMG_0001.jpg', make: null, model: null });

      expect(isMetadataDuplicate(first, second)).toBe(false);
    });

    it('rejects same-name RAW and rendered files outside the time window', () => {
      const first = createAsset({ originalFileName: 'IMG_0001.dng' });
      const second = createAsset({ dateTimeOriginal: new Date('2026-01-20T12:00:02.001Z') });

      expect(isMetadataDuplicate(first, second)).toBe(false);
    });

    it('rejects two rendered files with the same name', () => {
      const first = createAsset({ originalFileName: 'IMG_0001.heic' });
      const second = createAsset({ originalFileName: 'IMG_0001.jpg' });

      expect(isMetadataDuplicate(first, second)).toBe(false);
    });

    it('matches Pixel multi-file captures inside the wider time window', () => {
      const first = createAsset({ originalFileName: 'PXL_20260121_195958829.RAW-01.COVER.jpg' });
      const second = createAsset({
        originalFileName: 'PXL_20260121_195958829.RAW-02.ORIGINAL.dng',
        dateTimeOriginal: new Date('2026-01-20T12:00:10.000Z'),
      });

      expect(isMetadataDuplicate(first, second)).toBe(true);
    });

    it('rejects Pixel captures outside the wider time window', () => {
      const first = createAsset({ originalFileName: 'PXL_20260121_195958829.RAW-01.COVER.jpg' });
      const second = createAsset({
        originalFileName: 'PXL_20260121_195958829.RAW-02.ORIGINAL.dng',
        dateTimeOriginal: new Date('2026-01-20T12:00:15.001Z'),
      });

      expect(isMetadataDuplicate(first, second)).toBe(false);
    });
  });
});
