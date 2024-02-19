import { getAllAlbums, getAllAssets } from '@immich/sdk';
import {
  apiUtils,
  asKeyAuth,
  cliUtils,
  dbUtils,
  immichCli,
  testAssetDir,
} from 'src/utils';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe(`immich upload`, () => {
  let key: string;

  beforeAll(() => {
    apiUtils.setup();
  });

  beforeEach(async () => {
    await dbUtils.reset();
    key = await cliUtils.login();
  });

  describe('immich upload --recursive', () => {
    it('should upload a folder recursively', async () => {
      const { stderr, stdout, exitCode } = await immichCli([
        'upload',
        `${testAssetDir}/albums/nature/`,
        '--recursive',
      ]);
      expect(stderr).toBe('');
      expect(stdout.split('\n')).toEqual([
        expect.stringContaining('Successfully uploaded 9 assets'),
      ]);
      expect(exitCode).toBe(0);

      const assets = await getAllAssets({}, { headers: asKeyAuth(key) });
      expect(assets.length).toBe(9);
    });
  });

  describe('immich upload --recursive --album', () => {
    it('should create albums from folder names', async () => {
      const { stderr, stdout, exitCode } = await immichCli([
        'upload',
        `${testAssetDir}/albums/nature/`,
        '--recursive',
        '--album',
      ]);
      expect(stdout.split('\n')).toEqual([
        expect.stringContaining('Successfully uploaded 9 assets'),
      ]);
      expect(stderr).toBe('');
      expect(exitCode).toBe(0);

      const assets = await getAllAssets({}, { headers: asKeyAuth(key) });
      expect(assets.length).toBe(9);

      const albums = await getAllAlbums({}, { headers: asKeyAuth(key) });
      expect(albums.length).toBe(1);
      expect(albums[0].albumName).toBe('nature');
    });

    it('should add existing assets to albums', async () => {
      const response1 = await immichCli([
        'upload',
        `${testAssetDir}/albums/nature/`,
        '--recursive',
      ]);
      expect(response1.stdout.split('\n')).toEqual([
        expect.stringContaining('Successfully uploaded 9 assets'),
      ]);
      expect(response1.stderr).toBe('');
      expect(response1.exitCode).toBe(0);

      const assets1 = await getAllAssets({}, { headers: asKeyAuth(key) });
      expect(assets1.length).toBe(9);

      const albums1 = await getAllAlbums({}, { headers: asKeyAuth(key) });
      expect(albums1.length).toBe(0);

      const response2 = await immichCli([
        'upload',
        `${testAssetDir}/albums/nature/`,
        '--recursive',
        '--album',
      ]);
      expect(response2.stdout.split('\n')).toEqual([
        expect.stringContaining(
          'All assets were already uploaded, nothing to do.'
        ),
      ]);
      expect(response2.stderr).toBe('');
      expect(response2.exitCode).toBe(0);

      const assets2 = await getAllAssets({}, { headers: asKeyAuth(key) });
      expect(assets2.length).toBe(9);

      const albums2 = await getAllAlbums({}, { headers: asKeyAuth(key) });
      expect(albums2.length).toBe(1);
      expect(albums2[0].albumName).toBe('nature');
    });
  });

  describe('immich upload --recursive --album-name=e2e', () => {
    it('should create a named album', async () => {
      const { stderr, stdout, exitCode } = await immichCli([
        'upload',
        `${testAssetDir}/albums/nature/`,
        '--recursive',
        '--album-name=e2e',
      ]);
      expect(stdout.split('\n')).toEqual([
        expect.stringContaining('Successfully uploaded 9 assets'),
      ]);
      expect(stderr).toBe('');
      expect(exitCode).toBe(0);

      const assets = await getAllAssets({}, { headers: asKeyAuth(key) });
      expect(assets.length).toBe(9);

      const albums = await getAllAlbums({}, { headers: asKeyAuth(key) });
      expect(albums.length).toBe(1);
      expect(albums[0].albumName).toBe('e2e');
    });
  });
});
