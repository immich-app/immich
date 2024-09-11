import { LoginResponseDto, getAllAlbums, getAssetStatistics } from '@immich/sdk';
import { readFileSync } from 'node:fs';
import { mkdir, readdir, rm, symlink } from 'node:fs/promises';
import { asKeyAuth, immichCli, testAssetDir, utils } from 'src/utils';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe(`immich upload`, () => {
  let admin: LoginResponseDto;
  let key: string;

  beforeAll(async () => {
    await utils.resetDatabase();

    admin = await utils.adminSetup();
    key = await utils.cliLogin(admin.accessToken);
  });

  beforeEach(async () => {
    await utils.resetDatabase(['assets', 'albums']);
  });

  describe(`immich upload /path/to/file.jpg`, () => {
    it('should upload a single file', async () => {
      const { stderr, stdout, exitCode } = await immichCli(['upload', `${testAssetDir}/albums/nature/silver_fir.jpg`]);
      expect(stderr).toBe('');
      expect(stdout.split('\n')).toEqual(
        expect.arrayContaining([expect.stringContaining('Successfully uploaded 1 new asset')]),
      );
      expect(exitCode).toBe(0);

      const assets = await getAssetStatistics({}, { headers: asKeyAuth(key) });
      expect(assets.total).toBe(1);
    });

    it('should skip a duplicate file', async () => {
      const first = await immichCli(['upload', `${testAssetDir}/albums/nature/silver_fir.jpg`]);
      expect(first.stderr).toBe('');
      expect(first.stdout.split('\n')).toEqual(
        expect.arrayContaining([expect.stringContaining('Successfully uploaded 1 new asset')]),
      );
      expect(first.exitCode).toBe(0);

      const assets = await getAssetStatistics({}, { headers: asKeyAuth(key) });
      expect(assets.total).toBe(1);

      const second = await immichCli(['upload', `${testAssetDir}/albums/nature/silver_fir.jpg`]);
      expect(second.stderr).toBe('');
      expect(second.stdout.split('\n')).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Found 0 new files and 1 duplicate'),
          expect.stringContaining('All assets were already uploaded, nothing to do'),
        ]),
      );
      expect(second.exitCode).toBe(0);
    });

    it('should skip files that do not exist', async () => {
      const { stderr, stdout, exitCode } = await immichCli(['upload', `/path/to/file`]);
      expect(stderr).toBe('');
      expect(stdout.split('\n')).toEqual(expect.arrayContaining([expect.stringContaining('No files found, exiting')]));
      expect(exitCode).toBe(0);

      const assets = await getAssetStatistics({}, { headers: asKeyAuth(key) });
      expect(assets.total).toBe(0);
    });

    it('should have accurate dry run', async () => {
      const { stderr, stdout, exitCode } = await immichCli([
        'upload',
        `${testAssetDir}/albums/nature/silver_fir.jpg`,
        '--dry-run',
      ]);
      expect(stderr).toBe('');
      expect(stdout.split('\n')).toEqual(
        expect.arrayContaining([expect.stringContaining('Would have uploaded 1 asset')]),
      );
      expect(exitCode).toBe(0);

      const assets = await getAssetStatistics({}, { headers: asKeyAuth(key) });
      expect(assets.total).toBe(0);
    });

    it('dry run should handle duplicates', async () => {
      const first = await immichCli(['upload', `${testAssetDir}/albums/nature/silver_fir.jpg`]);
      expect(first.stderr).toBe('');
      expect(first.stdout.split('\n')).toEqual(
        expect.arrayContaining([expect.stringContaining('Successfully uploaded 1 new asset')]),
      );
      expect(first.exitCode).toBe(0);

      const assets = await getAssetStatistics({}, { headers: asKeyAuth(key) });
      expect(assets.total).toBe(1);

      const second = await immichCli(['upload', `${testAssetDir}/albums/nature/`, '--dry-run']);
      expect(second.stderr).toBe('');
      expect(second.stdout.split('\n')).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Found 8 new files and 1 duplicate'),
          expect.stringContaining('Would have uploaded 8 assets'),
        ]),
      );
      expect(second.exitCode).toBe(0);
    });
  });

  describe('immich upload --recursive', () => {
    it('should upload a folder recursively', async () => {
      const { stderr, stdout, exitCode } = await immichCli(['upload', `${testAssetDir}/albums/nature/`, '--recursive']);
      expect(stderr).toBe('');
      expect(stdout.split('\n')).toEqual(
        expect.arrayContaining([expect.stringContaining('Successfully uploaded 9 new assets')]),
      );
      expect(exitCode).toBe(0);

      const assets = await getAssetStatistics({}, { headers: asKeyAuth(key) });
      expect(assets.total).toBe(9);
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
          expect.stringContaining('Successfully uploaded 9 new assets'),
          expect.stringContaining('Successfully created 1 new album'),
          expect.stringContaining('Successfully updated 9 assets'),
        ]),
      );
      expect(stderr).toBe('');
      expect(exitCode).toBe(0);

      const assets = await getAssetStatistics({}, { headers: asKeyAuth(key) });
      expect(assets.total).toBe(9);

      const albums = await getAllAlbums({}, { headers: asKeyAuth(key) });
      expect(albums.length).toBe(1);
      expect(albums[0].albumName).toBe('nature');
    });

    it('should add existing assets to albums', async () => {
      const response1 = await immichCli(['upload', `${testAssetDir}/albums/nature/`, '--recursive']);
      expect(response1.stdout.split('\n')).toEqual(
        expect.arrayContaining([expect.stringContaining('Successfully uploaded 9 new assets')]),
      );
      expect(response1.stderr).toBe('');
      expect(response1.exitCode).toBe(0);

      const assets1 = await getAssetStatistics({}, { headers: asKeyAuth(key) });
      expect(assets1.total).toBe(9);

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

      const assets2 = await getAssetStatistics({}, { headers: asKeyAuth(key) });
      expect(assets2.total).toBe(9);

      const albums2 = await getAllAlbums({}, { headers: asKeyAuth(key) });
      expect(albums2.length).toBe(1);
      expect(albums2[0].albumName).toBe('nature');
    });

    it('should have accurate dry run', async () => {
      const { stderr, stdout, exitCode } = await immichCli([
        'upload',
        `${testAssetDir}/albums/nature/`,
        '--recursive',
        '--album',
        '--dry-run',
      ]);
      expect(stdout.split('\n')).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Would have uploaded 9 assets'),
          expect.stringContaining('Would have created 1 new album'),
          expect.stringContaining('Would have updated albums of 9 assets'),
        ]),
      );
      expect(stderr).toBe('');
      expect(exitCode).toBe(0);

      const assets = await getAssetStatistics({}, { headers: asKeyAuth(key) });
      expect(assets.total).toBe(0);

      const albums = await getAllAlbums({}, { headers: asKeyAuth(key) });
      expect(albums.length).toBe(0);
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
          expect.stringContaining('Successfully uploaded 9 new assets'),
          expect.stringContaining('Successfully created 1 new album'),
          expect.stringContaining('Successfully updated 9 assets'),
        ]),
      );
      expect(stderr).toBe('');
      expect(exitCode).toBe(0);

      const assets = await getAssetStatistics({}, { headers: asKeyAuth(key) });
      expect(assets.total).toBe(9);

      const albums = await getAllAlbums({}, { headers: asKeyAuth(key) });
      expect(albums.length).toBe(1);
      expect(albums[0].albumName).toBe('e2e');
    });

    it('should have accurate dry run', async () => {
      const { stderr, stdout, exitCode } = await immichCli([
        'upload',
        `${testAssetDir}/albums/nature/`,
        '--recursive',
        '--album-name=e2e',
        '--dry-run',
      ]);
      expect(stdout.split('\n')).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Would have uploaded 9 assets'),
          expect.stringContaining('Would have created 1 new album'),
          expect.stringContaining('Would have updated albums of 9 assets'),
        ]),
      );
      expect(stderr).toBe('');
      expect(exitCode).toBe(0);

      const assets = await getAssetStatistics({}, { headers: asKeyAuth(key) });
      expect(assets.total).toBe(0);

      const albums = await getAllAlbums({}, { headers: asKeyAuth(key) });
      expect(albums.length).toBe(0);
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
          expect.stringContaining('Successfully uploaded 9 new assets'),
          expect.stringContaining('Deleting assets that have been uploaded'),
        ]),
      );
      expect(stderr).toBe('');
      expect(exitCode).toBe(0);

      const assets = await getAssetStatistics({}, { headers: asKeyAuth(key) });
      expect(assets.total).toBe(9);
    });

    it('should have accurate dry run', async () => {
      await mkdir(`/tmp/albums/nature`, { recursive: true });
      const filesToLink = await readdir(`${testAssetDir}/albums/nature`);
      for (const file of filesToLink) {
        await symlink(`${testAssetDir}/albums/nature/${file}`, `/tmp/albums/nature/${file}`);
      }

      const { stderr, stdout, exitCode } = await immichCli(['upload', `/tmp/albums/nature`, '--delete', '--dry-run']);

      const files = await readdir(`/tmp/albums/nature`);
      await rm(`/tmp/albums/nature`, { recursive: true });
      expect(files.length).toBe(9);

      expect(stdout.split('\n')).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Would have uploaded 9 assets'),
          expect.stringContaining('Would have deleted 9 local assets'),
        ]),
      );
      expect(stderr).toBe('');
      expect(exitCode).toBe(0);

      const assets = await getAssetStatistics({}, { headers: asKeyAuth(key) });
      expect(assets.total).toBe(0);
    });
  });

  describe('immich upload --skip-hash', () => {
    it('should skip hashing', async () => {
      const filename = `albums/nature/silver_fir.jpg`;
      await utils.createAsset(admin.accessToken, {
        assetData: {
          bytes: readFileSync(`${testAssetDir}/${filename}`),
          filename: 'silver_fit.jpg',
        },
      });
      const { stderr, stdout, exitCode } = await immichCli(['upload', `${testAssetDir}/${filename}`, '--skip-hash']);

      expect(stderr).toBe('');
      expect(stdout.split('\n')).toEqual(
        expect.arrayContaining([
          'Skipping hash check, assuming all files are new',
          expect.stringContaining('Successfully uploaded 0 new assets'),
          expect.stringContaining('Skipped 1 duplicate asset'),
        ]),
      );
      expect(exitCode).toBe(0);

      const assets = await getAssetStatistics({}, { headers: asKeyAuth(key) });
      expect(assets.total).toBe(1);
    });

    it('should throw an error if attempting dry run', async () => {
      const { stderr, stdout, exitCode } = await immichCli([
        'upload',
        `${testAssetDir}/albums/nature/`,
        '--skip-hash',
        '--dry-run',
      ]);

      expect(stdout).toBe('');
      expect(stderr).toEqual(`error: option '-n, --dry-run' cannot be used with option '-h, --skip-hash'`);
      expect(exitCode).not.toBe(0);

      const assets = await getAssetStatistics({}, { headers: asKeyAuth(key) });
      expect(assets.total).toBe(0);
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
        expect.arrayContaining([
          'Found 9 new files and 0 duplicates',
          expect.stringContaining('Successfully uploaded 9 new assets'),
        ]),
      );
      expect(exitCode).toBe(0);

      const assets = await getAssetStatistics({}, { headers: asKeyAuth(key) });
      expect(assets.total).toBe(9);
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

  describe('immich upload --ignore <pattern>', () => {
    it('should work', async () => {
      const { stderr, stdout, exitCode } = await immichCli([
        'upload',
        `${testAssetDir}/albums/nature/`,
        '--ignore',
        'silver_fir.jpg',
      ]);

      expect(stderr).toBe('');
      expect(stdout.split('\n')).toEqual(
        expect.arrayContaining([
          'Found 8 new files and 0 duplicates',
          expect.stringContaining('Successfully uploaded 8 new assets'),
        ]),
      );
      expect(exitCode).toBe(0);

      const assets = await getAssetStatistics({}, { headers: asKeyAuth(key) });
      expect(assets.total).toBe(8);
    });

    it('should ignore assets matching glob pattern', async () => {
      const { stderr, stdout, exitCode } = await immichCli([
        'upload',
        `${testAssetDir}/albums/nature/`,
        '--ignore',
        '!(*_*_*).jpg',
      ]);

      expect(stderr).toBe('');
      expect(stdout.split('\n')).toEqual(
        expect.arrayContaining([
          'Found 1 new files and 0 duplicates',
          expect.stringContaining('Successfully uploaded 1 new asset'),
        ]),
      );
      expect(exitCode).toBe(0);

      const assets = await getAssetStatistics({}, { headers: asKeyAuth(key) });
      expect(assets.total).toBe(1);
    });

    it('should have accurate dry run', async () => {
      const { stderr, stdout, exitCode } = await immichCli([
        'upload',
        `${testAssetDir}/albums/nature/`,
        '--ignore',
        'silver_fir.jpg',
        '--dry-run',
      ]);

      expect(stderr).toBe('');
      expect(stdout.split('\n')).toEqual(
        expect.arrayContaining([
          'Found 8 new files and 0 duplicates',
          expect.stringContaining('Would have uploaded 8 assets'),
        ]),
      );
      expect(exitCode).toBe(0);

      const assets = await getAssetStatistics({}, { headers: asKeyAuth(key) });
      expect(assets.total).toBe(0);
    });
  });
});
