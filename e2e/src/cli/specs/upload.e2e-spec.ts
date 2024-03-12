import { getAllAlbums, getAllAssets } from '@immich/sdk';
import { mkdir, readdir, rm, symlink } from 'node:fs/promises';
import { asKeyAuth, immichCli, testAssetDir, utils } from 'src/utils';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe(`immich upload`, () => {
  let key: string;

  beforeAll(async () => {
    await utils.resetDatabase();
    key = await utils.cliLogin();
  });

  beforeEach(async () => {
    await utils.resetDatabase(['assets', 'albums']);
  });

  describe('immich upload --recursive', () => {
    it('should upload a folder recursively', async () => {
      const { stderr, stdout, exitCode } = await immichCli(['upload', `${testAssetDir}/albums/nature/`, '--recursive']);
      expect(stderr).toBe('');
      expect(stdout.split('\n')).toEqual(
        expect.arrayContaining([expect.stringContaining('Successfully uploaded 9 assets')]),
      );
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
      expect(stdout.split('\n')).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Successfully uploaded 9 assets'),
          expect.stringContaining('Successfully created 1 new album'),
          expect.stringContaining('Successfully updated 9 assets'),
        ]),
      );
      expect(stderr).toBe('');
      expect(exitCode).toBe(0);

      const assets = await getAllAssets({}, { headers: asKeyAuth(key) });
      expect(assets.length).toBe(9);

      const albums = await getAllAlbums({}, { headers: asKeyAuth(key) });
      expect(albums.length).toBe(1);
      expect(albums[0].albumName).toBe('nature');
    });

    it('should add existing assets to albums', async () => {
      const response1 = await immichCli(['upload', `${testAssetDir}/albums/nature/`, '--recursive']);
      expect(response1.stdout.split('\n')).toEqual(
        expect.arrayContaining([expect.stringContaining('Successfully uploaded 9 assets')]),
      );
      expect(response1.stderr).toBe('');
      expect(response1.exitCode).toBe(0);

      const assets1 = await getAllAssets({}, { headers: asKeyAuth(key) });
      expect(assets1.length).toBe(9);

      const albums1 = await getAllAlbums({}, { headers: asKeyAuth(key) });
      expect(albums1.length).toBe(0);

      const response2 = await immichCli(['upload', `${testAssetDir}/albums/nature/`, '--recursive', '--album']);
      expect(response2.stdout.split('\n')).toEqual(
        expect.arrayContaining([
          expect.stringContaining('All assets were already uploaded, nothing to do.'),
          expect.stringContaining('Successfully updated 9 assets'),
        ]),
      );
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
      expect(stdout.split('\n')).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Successfully uploaded 9 assets'),
          expect.stringContaining('Successfully created 1 new album'),
          expect.stringContaining('Successfully updated 9 assets'),
        ]),
      );
      expect(stderr).toBe('');
      expect(exitCode).toBe(0);

      const assets = await getAllAssets({}, { headers: asKeyAuth(key) });
      expect(assets.length).toBe(9);

      const albums = await getAllAlbums({}, { headers: asKeyAuth(key) });
      expect(albums.length).toBe(1);
      expect(albums[0].albumName).toBe('e2e');
    });
  });

  describe('immich upload --delete', () => {
    it('should delete local files if specified', async () => {
      await mkdir(`/tmp/albums/nature`, { recursive: true });
      const filesToLink = await readdir(`${testAssetDir}/albums/nature`);
      for (const file of filesToLink) {
        await symlink(`${testAssetDir}/albums/nature/${file}`, `/tmp/albums/nature/${file}`);
      }

      const { stderr, stdout, exitCode } = await immichCli(['upload', `/tmp/albums/nature`, '--delete']);

      const files = await readdir(`/tmp/albums/nature`);
      await rm(`/tmp/albums/nature`, { recursive: true });
      expect(files).toEqual([]);

      expect(stdout.split('\n')).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Successfully uploaded 9 assets'),
          expect.stringContaining('Deleting assets that have been uploaded'),
        ]),
      );
      expect(stderr).toBe('');
      expect(exitCode).toBe(0);

      const assets = await getAllAssets({}, { headers: asKeyAuth(key) });
      expect(assets.length).toBe(9);
    });
  });

  describe('immich upload --concurrency <number>', () => {
    it('should work', async () => {
      const { stderr, stdout, exitCode } = await immichCli([
        'upload',
        `${testAssetDir}/albums/nature/`,
        '--concurrency',
        '2',
      ]);

      expect(stderr).toBe('');
      expect(stdout.split('\n')).toEqual(
        expect.arrayContaining([expect.stringContaining('Successfully uploaded 9 assets')]),
      );
      expect(exitCode).toBe(0);

      const assets = await getAllAssets({}, { headers: asKeyAuth(key) });
      expect(assets.length).toBe(9);
    });

    it('should reject string argument', async () => {
      const { stderr, exitCode } = await immichCli([
        'upload',
        `${testAssetDir}/albums/nature/`,
        '--concurrency string',
      ]);

      expect(stderr).toContain('unknown option');
      expect(exitCode).not.toBe(0);
    });

    it('should reject command without number', async () => {
      const { stderr, exitCode } = await immichCli(['upload', `${testAssetDir}/albums/nature/`, '--concurrency']);

      expect(stderr).toContain('argument missing');
      expect(exitCode).not.toBe(0);
    });
  });
});
