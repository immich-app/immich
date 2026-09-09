import type { AssetResponseDto } from '@immich/sdk';
import { canCopyImageToClipboard, getAssetFilename, getFilenameExtension, orderStackAssets } from './asset-utils';

describe('get file extension from filename', () => {
  it('returns the extension without including the dot', () => {
    expect(getFilenameExtension('filename.txt')).toEqual('txt');
  });

  it('takes the last file extension and ignores the rest', () => {
    expect(getFilenameExtension('filename.txt.pdf')).toEqual('pdf');
    expect(getFilenameExtension('filename.txt.pdf.jpg')).toEqual('jpg');
  });

  it('returns an empty string when no file extension is found', () => {
    expect(getFilenameExtension('filename')).toEqual('');
    expect(getFilenameExtension('filename.')).toEqual('');
    expect(getFilenameExtension('filename..')).toEqual('');
    expect(getFilenameExtension('.filename')).toEqual('');
  });

  it('returns the extension from a filepath', () => {
    expect(getFilenameExtension('/folder/file.txt')).toEqual('txt');
    expect(getFilenameExtension('./folder/file.txt')).toEqual('txt');
    expect(getFilenameExtension('~/folder/file.txt')).toEqual('txt');
    expect(getFilenameExtension('./folder/.file.txt')).toEqual('txt');
    expect(getFilenameExtension('/folder.with.dots/file.txt')).toEqual('txt');
  });
});

describe('get asset filename', () => {
  it('returns the filename including file extension', () => {
    for (const { asset, result } of [
      {
        asset: {
          originalFileName: 'filename',
          originalPath: '/data/library/test/2016/2016-08-30/filename.jpg',
        },
        result: 'filename.jpg',
      },
      {
        asset: {
          originalFileName: 'new-filename',
          originalPath: '/data/library/89d14e47-a40d-4cae-a347-a914cdef1f22/2016/2016-08-30/filename.jpg',
        },
        result: 'new-filename.jpg',
      },
      {
        asset: {
          originalFileName: 'new-filename.txt',
          originalPath: '/data/library/test/2016/2016-08-30/filename.txt.jpg',
        },
        result: 'new-filename.txt.jpg',
      },
    ]) {
      expect(getAssetFilename(asset as AssetResponseDto)).toEqual(result);
    }
  });
});

describe('copy image to clipboard', () => {
  // This test is dubious, as it totally on the environment where the test is run which is mocked.
  it('should allow copy image to clipboard', () => {
    expect(canCopyImageToClipboard()).toEqual(true);
  });
});

describe('order stack assets', () => {
  it('orders assets from newest to oldest independently of the primary asset', () => {
    const assets = [
      { id: 'primary', fileCreatedAt: '2026-01-02T00:00:00.000Z' },
      { id: 'before-primary', fileCreatedAt: '2026-01-01T00:00:00.000Z' },
      { id: 'after-primary', fileCreatedAt: '2026-01-03T00:00:00.000Z' },
    ] as AssetResponseDto[];

    expect(orderStackAssets(assets).map(({ id }) => id)).toEqual(['after-primary', 'primary', 'before-primary']);
  });
});
