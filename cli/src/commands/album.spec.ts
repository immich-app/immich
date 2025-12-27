import { addAssetsToAlbum, getAlbumInfo, getAllAlbums } from '@immich/sdk';
import { addAssets, albumInfo, listAlbums } from 'src/commands/album';
import { BaseOptions } from 'src/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@immich/sdk');
vi.mock('src/utils', async () => {
  const actual = await vi.importActual('src/utils');
  return {
    ...actual,
    authenticate: vi.fn(),
    logError: vi.fn(),
    withError: (promise: Promise<any>) => promise.then((data) => [null, data]).catch((err) => [err, null]),
  };
});

describe('album commands', () => {
  const options = {} as BaseOptions;
  const jsonOptions = { jsonOutput: true } as any;

  describe('listAlbums', () => {
    it('should list albums', async () => {
      const albums = [
        { id: '1', albumName: 'Album 1' },
        { id: '2', albumName: 'Album 2' },
      ];
      vi.mocked(getAllAlbums).mockResolvedValue(albums as any);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await listAlbums(options);

      expect(consoleSpy).toHaveBeenCalledWith('1\tAlbum 1');
      expect(consoleSpy).toHaveBeenCalledWith('2\tAlbum 2');
    });

    it('should list albums in JSON', async () => {
      const albums = [
        { id: '1', albumName: 'Album 1' },
        { id: '2', albumName: 'Album 2' },
      ];
      vi.mocked(getAllAlbums).mockResolvedValue(albums as any);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await listAlbums(jsonOptions);

      expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(albums, undefined, 4));
    });
  });

  describe('albumInfo', () => {
    it('should show album info', async () => {
      const album = {
        id: '1',
        albumName: 'Album 1',
        assetCount: 2,
        assets: [
          { id: 'a1', originalFileName: 'photo1.jpg' },
          { id: 'a2', originalFileName: 'photo2.jpg' },
        ],
      };
      vi.mocked(getAlbumInfo).mockResolvedValue(album as any);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await albumInfo('1', options);

      expect(consoleSpy).toHaveBeenCalledWith('ID: 1');
      expect(consoleSpy).toHaveBeenCalledWith('Name: Album 1');
      expect(consoleSpy).toHaveBeenCalledWith('Assets: 2');
      expect(consoleSpy).toHaveBeenCalledWith('a1\tphoto1.jpg');
      expect(consoleSpy).toHaveBeenCalledWith('a2\tphoto2.jpg');
    });

    it('should show album info in JSON', async () => {
      const album = {
        id: '1',
        albumName: 'Album 1',
        assetCount: 2,
        assets: [
          { id: 'a1', originalFileName: 'photo1.jpg' },
          { id: 'a2', originalFileName: 'photo2.jpg' },
        ],
      };
      vi.mocked(getAlbumInfo).mockResolvedValue(album as any);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await albumInfo('1', jsonOptions);

      expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(album, undefined, 4));
    });
  });

  describe('addAssets', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should add assets to album', async () => {
      vi.mocked(addAssetsToAlbum).mockResolvedValue([
        { id: 'a1', success: true },
        { id: 'a2', success: true },
      ] as any);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await addAssets('1', ['a1', 'a2'], options);

      expect(addAssetsToAlbum).toHaveBeenCalledWith({ id: '1', bulkIdsDto: { ids: ['a1', 'a2'] } });
      expect(consoleSpy).toHaveBeenCalledWith('Added 2 assets to album 1');
    });

    it('should add assets to album and output JSON', async () => {
      const result = [{ id: 'a1', success: true }];
      vi.mocked(addAssetsToAlbum).mockResolvedValue(result as any);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await addAssets('1', ['a1'], jsonOptions);

      expect(addAssetsToAlbum).toHaveBeenCalledWith({ id: '1', bulkIdsDto: { ids: ['a1'] } });
      expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(result, undefined, 4));
    });

    it('should report failed additions', async () => {
      vi.mocked(addAssetsToAlbum).mockResolvedValue([
        { id: 'a1', success: true },
        { id: 'a2', success: false, error: 'not_found' },
      ] as any);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await addAssets('1', ['a1', 'a2'], options);

      expect(consoleSpy).toHaveBeenCalledWith('Added 1 asset to album 1 (1 asset failed)');
    });

    it('should report duplicates separately', async () => {
      vi.mocked(addAssetsToAlbum).mockResolvedValue([
        { id: 'a1', success: true },
        { id: 'a2', success: false, error: 'duplicate' },
      ] as any);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await addAssets('1', ['a1', 'a2'], options);

      expect(consoleSpy).toHaveBeenCalledWith('Added 1 asset to album 1 (1 asset already in album)');
    });

    it('should batch asset additions', async () => {
      vi.mocked(addAssetsToAlbum).mockResolvedValue([{ id: 'a1', success: true }] as any);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await addAssets(
        '1',
        ['a1', 'a2'],
        { ...options, batchSize: 1 },
      );

      expect(addAssetsToAlbum).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalledWith('Added 2 assets to album 1');
    });
  });
});
