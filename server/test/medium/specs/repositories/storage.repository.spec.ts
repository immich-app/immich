import type { WalkError, WalkItem } from '@immich/walkrs' with { 'resolution-mode': 'import' };
import { Kysely } from 'kysely';
import fs from 'node:fs/promises';
import os from 'node:os';
import path, { join } from 'node:path';
import { WalkOptionsDto } from 'src/dtos/library.dto';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

interface Test {
  test: string;
  options: WalkOptionsDto;
  files: Record<string, boolean>;
}

const createTestFiles = async (basePath: string, files: string[]) => {
  await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(basePath, file.replace(/^\//, ''));
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, '');
    }),
  );
};

const tests: Test[] = [
  {
    test: 'should return empty when walking an empty path list',
    options: {
      pathsToWalk: [],
    },
    files: {},
  },
  {
    test: 'should walk a single path',
    options: {
      pathsToWalk: ['/photos/'],
    },
    files: {
      '/photos/image.jpg': true,
    },
  },
  {
    test: 'should exclude by file extension',
    options: {
      pathsToWalk: ['/photos/'],
      exclusionPatterns: ['**/*.tif'],
    },
    files: {
      '/photos/image.jpg': true,
      '/photos/image.tif': false,
    },
  },
  {
    test: 'should exclude by file extension without case sensitivity',
    options: {
      pathsToWalk: ['/photos/'],
      exclusionPatterns: ['**/*.TIF'],
    },
    files: {
      '/photos/image.jpg': true,
      '/photos/image.tif': false,
      '/photos/image.tIf': false,
      '/photos/image.TIF': false,
    },
  },
  {
    test: 'should exclude by folder',
    options: {
      pathsToWalk: ['/photos/'],
      exclusionPatterns: ['**/raw/**'],
    },
    files: {
      '/photos/image.jpg': true,
      '/photos/raw/image.jpg': false,
      '/photos/raw2/image.jpg': true,
      '/photos/folder/raw/image.jpg': false,
      '/photos/walk/image.jpg': true,
    },
  },
  {
    test: 'should walk multiple paths',
    options: {
      pathsToWalk: ['/photos/', '/images/', '/albums/'],
    },
    files: {
      '/photos/image1.jpg': true,
      '/images/image2.jpg': true,
      '/albums/image3.jpg': true,
    },
  },
  {
    test: 'should walk a single path without trailing slash',
    options: {
      pathsToWalk: ['/photos'],
    },
    files: {
      '/photos/image.jpg': true,
    },
  },
  {
    test: 'should walk a single path',
    options: {
      pathsToWalk: ['/photos/'],
    },
    files: {
      '/photos/image.jpg': true,
      '/photos/subfolder/image1.jpg': true,
      '/photos/subfolder/image2.jpg': true,
      '/image1.jpg': false,
    },
  },
  {
    test: 'should filter file extensions',
    options: {
      pathsToWalk: ['/photos/'],
    },
    files: {
      '/photos/image.jpg': true,
      '/photos/image.txt': false,
      '/photos/1': false,
    },
  },
  {
    test: 'should include photo and video extensions',
    options: {
      pathsToWalk: ['/photos/', '/videos/'],
    },
    files: {
      '/photos/image.jpg': true,
      '/photos/image.jpeg': true,
      '/photos/image.heic': true,
      '/photos/image.heif': true,
      '/photos/image.png': true,
      '/photos/image.gif': true,
      '/photos/image.tif': true,
      '/photos/image.tiff': true,
      '/photos/image.webp': true,
      '/photos/image.dng': true,
      '/photos/image.nef': true,
      '/videos/video.mp4': true,
      '/videos/video.mov': true,
      '/videos/video.webm': true,
    },
  },
  {
    test: 'should check file extensions without case sensitivity',
    options: {
      pathsToWalk: ['/photos/'],
    },
    files: {
      '/photos/image.jpg': true,
      '/photos/image.Jpg': true,
      '/photos/image.jpG': true,
      '/photos/image.JPG': true,
      '/photos/image.jpEg': true,
      '/photos/image.TIFF': true,
      '/photos/image.tif': true,
      '/photos/image.dng': true,
      '/photos/image.NEF': true,
    },
  },
  {
    test: 'should normalize the path',
    options: {
      pathsToWalk: ['/photos/1/../2'],
    },
    files: {
      '/photos/1/image.jpg': false,
      '/photos/2/image.jpg': true,
    },
  },
  {
    test: 'should support special characters in paths',
    options: {
      pathsToWalk: ['/photos (new)'],
    },
    files: {
      ['/photos (new)/1.jpg']: true,
    },
  },
];

const setup = (db?: Kysely<DB>) => {
  const { ctx } = newMediumService(BaseService, {
    database: db || defaultDatabase,
    real: [],
    mock: [LoggingRepository],
  });
  return { sut: ctx.get(StorageRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(StorageRepository.name, () => {
  let sut: StorageRepository;

  beforeEach(() => {
    ({ sut } = setup());
  });

  describe('walk', () => {
    for (const { test, options, files } of tests) {
      describe(test, () => {
        const fileList = Object.keys(files);
        let tempDir: string;

        beforeEach(async () => {
          tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'immich-storage-test-'));
          await createTestFiles(tempDir, fileList);
        });

        afterEach(async () => {
          await fs.rm(tempDir, { recursive: true, force: true });
        });

        it('returns expected files', async () => {
          const adjustedOptions = {
            ...options,
            pathsToWalk: options.pathsToWalk.map((p) => path.join(tempDir, p.replace(/^\//, ''))),
          };

          const actual: string[] = [];
          for await (const batch of sut.walk(adjustedOptions)) {
            for (const item of batch) {
              if (item.type === 'entry') {
                actual.push(item.path);
              }
            }
          }
          const expected = Object.entries(files)
            .filter((entry) => entry[1])
            .map(([file]) => path.join(tempDir, file.replace(/^\//, '')));

          expect(actual.toSorted()).toEqual(expected.toSorted());
        });
      });
    }

    it('should handle access denied errors gracefully', async () => {
      const testDir = await fs.mkdtemp(join(os.tmpdir(), 'immich-test-access-denied-'));
      const restrictedDir = join(testDir, 'restricted');
      const restrictedFile = join(restrictedDir, 'file.jpg');
      const accessibleFile = join(testDir, 'accessible.jpg');

      try {
        // Create test directory structure
        await fs.mkdir(restrictedDir, { recursive: true });
        await fs.writeFile(accessibleFile, 'accessible content');
        await fs.writeFile(restrictedFile, 'restricted content');

        // Remove all permissions from restricted directory to simulate access denied
        await fs.chmod(restrictedDir, 0o000);

        const actual: string[] = [];
        const errors: WalkItem[] = [];
        for await (const batch of sut.walk({ pathsToWalk: [testDir] })) {
          for (const item of batch) {
            if (item.type === 'entry') {
              actual.push(item.path);
            } else {
              errors.push(item);
            }
          }
        }

        // Should successfully walk accessible file but skip restricted directory
        expect(actual).toContain(accessibleFile);
        expect(actual).not.toContain(restrictedFile);
        // Should have encountered an error for the restricted directory
        expect(errors.length).toBe(1);
        expect(errors.some((e) => e.type === 'error' && e.message?.includes('restricted'))).toBe(true);
      } finally {
        // Cleanup: restore permissions before deletion
        try {
          await fs.chmod(restrictedDir, 0o755);
        } catch {
          // Ignore errors if directory was already deleted or permissions cannot be restored
        }
        await fs.rm(testDir, { recursive: true, force: true });
      }
    });

    it('should return error details for access denied paths', async () => {
      const testDir = await fs.mkdtemp(join(os.tmpdir(), 'immich-test-access-denied-'));
      const restrictedDir = join(testDir, 'restricted');
      const restrictedFile = join(restrictedDir, 'file.jpg');
      const accessibleFile = join(testDir, 'accessible.jpg');

      try {
        // Create test directory structure
        await fs.mkdir(restrictedDir, { recursive: true });
        await fs.writeFile(accessibleFile, 'accessible content');
        await fs.writeFile(restrictedFile, 'restricted content');

        // Remove all permissions from restricted directory to simulate access denied
        await fs.chmod(restrictedDir, 0o000);

        const errors: WalkError[] = [];
        for await (const batch of sut.walk({ pathsToWalk: [testDir] })) {
          for (const item of batch) {
            if (item.type === 'error') {
              errors.push(item);
            }
          }
        }

        // Should have error details including path and message
        expect(errors.length).toBe(1);
        const restrictedError = errors.find((e) => e.type === 'error' && e.message?.includes('restricted'));
        expect(restrictedError).toBeDefined();
        expect(restrictedError?.type).toBe('error');
        expect(restrictedError?.message).toBeDefined();
      } finally {
        // Cleanup: restore permissions before deletion
        try {
          await fs.chmod(restrictedDir, 0o755);
        } catch {
          // Ignore errors if directory was already deleted or permissions cannot be restored
        }
        await fs.rm(testDir, { recursive: true, force: true });
      }
    });
  });
});
