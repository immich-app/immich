import { platform } from 'node:os';
import { UploadOptionsDto, getAlbumName } from 'src/commands/asset';
import { describe, expect, it } from 'vitest';

describe('Unit function tests', () => {
  it('should return a non-undefined value', () => {
    if (platform() === 'win32') {
      // This is meaningless for Unix systems.
      expect(getAlbumName(String.raw`D:\test\Filename.txt`, {} as UploadOptionsDto)).toBe('test');
    }
    expect(getAlbumName('D:/parentfolder/test/Filename.txt', {} as UploadOptionsDto)).toBe('test');
  });

  it('has higher priority to return `albumName` in `options`', () => {
    expect(getAlbumName('/parentfolder/test/Filename.txt', { albumName: 'example' } as UploadOptionsDto)).toBe(
      'example',
    );
  });
});
