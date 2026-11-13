import { isRawAsset } from '#lib/utils/raw-asset.ts';

const asset = (fileName: string, mimeType?: string) => ({
  originalFileName: fileName,
  originalPath: `/data/library/${fileName}`,
  originalMimeType: mimeType,
});

describe('isRawAsset', () => {
  it('detects camera raw files by extension', () => {
    expect(isRawAsset(asset('IMG_0001.CR3'))).toBe(true);
    expect(isRawAsset(asset('IMG_0001.CR2'))).toBe(true);
    expect(isRawAsset(asset('IMG_0001.dng'))).toBe(true);
    expect(isRawAsset(asset('IMG_0001.NEF'))).toBe(true);
    expect(isRawAsset(asset('IMG_0001.ARW'))).toBe(true);
    expect(isRawAsset(asset('IMG_0001.RAF'))).toBe(true);
  });

  it('does not treat jpeg, heic, or photoshop files as raw', () => {
    expect(isRawAsset(asset('IMG_0001.JPG', 'image/jpeg'))).toBe(false);
    expect(isRawAsset(asset('IMG_0001.HEIC', 'image/heic'))).toBe(false);
    expect(isRawAsset(asset('edit.psd', 'image/vnd.adobe.photoshop'))).toBe(false);
  });

  it('detects raw mime types when the filename has no extension', () => {
    expect(isRawAsset(asset('IMG_0001', 'image/x-canon-cr3'))).toBe(true);
    expect(isRawAsset(asset('IMG_0001', 'image/jpeg'))).toBe(false);
  });
});
