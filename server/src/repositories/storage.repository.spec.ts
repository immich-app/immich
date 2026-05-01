import mockfs from 'mock-fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { CrawlOptionsDto } from 'src/dtos/library.dto';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { automock } from 'test/utils';

interface Test {
  test: string;
  options: CrawlOptionsDto;
  files: Record<string, boolean>;
}

const cwd = process.cwd();

const tests: Test[] = [
  {
    test: 'should return empty when crawling an empty path list',
    options: {
      pathsToCrawl: [],
    },
    files: {},
  },
  {
    test: 'should crawl a single path',
    options: {
      pathsToCrawl: ['/photos/'],
    },
    files: {
      '/photos/image.jpg': true,
    },
  },
  {
    test: 'should exclude by file extension',
    options: {
      pathsToCrawl: ['/photos/'],
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
      pathsToCrawl: ['/photos/'],
      exclusionPatterns: ['**/*.TIF'],
    },
    files: {
      '/photos/image.jpg': true,
      '/photos/image.tif': false,
    },
  },
  {
    test: 'should exclude by folder',
    options: {
      pathsToCrawl: ['/photos/'],
      exclusionPatterns: ['**/raw/**'],
    },
    files: {
      '/photos/image.jpg': true,
      '/photos/raw/image.jpg': false,
      '/photos/raw2/image.jpg': true,
      '/photos/folder/raw/image.jpg': false,
      '/photos/crawl/image.jpg': true,
    },
  },
  {
    test: 'should crawl multiple paths',
    options: {
      pathsToCrawl: ['/photos/', '/images/', '/albums/'],
    },
    files: {
      '/photos/image1.jpg': true,
      '/images/image2.jpg': true,
      '/albums/image3.jpg': true,
    },
  },
  {
    test: 'should crawl a single path without trailing slash',
    options: {
      pathsToCrawl: ['/photos'],
    },
    files: {
      '/photos/image.jpg': true,
    },
  },
  {
    test: 'should crawl a single path',
    options: {
      pathsToCrawl: ['/photos/'],
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
      pathsToCrawl: ['/photos/'],
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
      pathsToCrawl: ['/photos/', '/videos/'],
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
      pathsToCrawl: ['/photos/'],
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
      pathsToCrawl: ['/photos/1/../2'],
    },
    files: {
      '/photos/1/image.jpg': false,
      '/photos/2/image.jpg': true,
    },
  },
  {
    test: 'should return absolute paths',
    options: {
      pathsToCrawl: ['photos'],
    },
    files: {
      [`${cwd}/photos/1.jpg`]: true,
      [`${cwd}/photos/2.jpg`]: true,
      [`/photos/3.jpg`]: false,
    },
  },
  {
    test: 'should support special characters in paths',
    options: {
      pathsToCrawl: ['/photos (new)'],
    },
    files: {
      ['/photos (new)/1.jpg']: true,
    },
  },
];

describe(StorageRepository.name, () => {
  let sut: StorageRepository;

  beforeEach(() => {
    // eslint-disable-next-line no-sparse-arrays
    sut = new StorageRepository(automock(LoggingRepository, { args: [, { getEnv: () => ({}) }], strict: false }));
  });

  afterEach(() => {
    mockfs.restore();
  });

  describe('crawl', () => {
    for (const { test, options, files } of tests) {
      it(test, async () => {
        mockfs(Object.fromEntries(Object.keys(files).map((file) => [file, ''])));

        const actual = await sut.crawl(options);
        const expected = Object.entries(files)
          .filter((entry) => entry[1])
          .map(([file]) => file);

        expect(actual.toSorted()).toEqual(expected.toSorted());
      });
    }
  });

  describe('getFolderSize', () => {
    it('sums nested file sizes recursively', async () => {
      mockfs.restore();
      const testDir = join(tmpdir(), `immich-storage-repo-${Date.now()}`);
      try {
        await mkdir(join(testDir, 'aa'), { recursive: true });
        await writeFile(join(testDir, 'aa/one.jpg'), 'one');
        await mkdir(join(testDir, 'bb'), { recursive: true });
        await writeFile(join(testDir, 'bb/two.jpg'), 'two!!');
        await mkdir(join(testDir, 'empty'), { recursive: true });

        await expect(sut.getFolderSize(testDir)).resolves.toBe(8);
      } finally {
        await rm(testDir, { recursive: true, force: true });
      }
    });

    it('returns zero when the folder does not exist', async () => {
      mockfs({});

      await expect(sut.getFolderSize('/data/upload/missing')).resolves.toBe(0);
    });
  });

  describe('createZipStream', () => {
    it('does not start subsequent Readable entries until the previous one is drained', async () => {
      // Regression for S3 archive hang: archiver-utils `normalizeInputSource()` pipes every
      // input stream to a PassThrough immediately, which triggers `_read()` on the source via
      // pipe's `resume()`. If `addFile()` forwards all inputs to `archive.append()` synchronously,
      // every LazyS3Readable opens its S3 socket up-front — the exact behaviour that stalls the
      // archive in `redirect` serve mode on a large selection.
      const readCalls = [0, 0, 0];
      const sources = readCalls.map(
        (_, i) =>
          new Readable({
            read() {
              readCalls[i]++;
            },
          }),
      );

      const zip = sut.createZipStream();
      zip.stream.on('error', () => {}); // silence archive errors on test cleanup

      for (const [i, source] of sources.entries()) {
        zip.addFile(source, `file-${i}.txt`);
      }

      // Drain microtasks and process.nextTick callbacks so any eagerly-scheduled
      // `_read()` fires before we assert.
      await new Promise((resolve) => setImmediate(resolve));

      expect(readCalls[1]).toBe(0);
      expect(readCalls[2]).toBe(0);

      zip.stream.destroy();
      for (const source of sources) {
        source.destroy();
      }
    });

    it('produces an archive containing every Readable entry', async () => {
      const sources = [
        Readable.from([Buffer.from('content-0')]),
        Readable.from([Buffer.from('content-1')]),
        Readable.from([Buffer.from('content-2')]),
      ];

      const zip = sut.createZipStream();
      for (const [i, source] of sources.entries()) {
        zip.addFile(source, `file-${i}.txt`);
      }
      void zip.finalize();

      const chunks: Buffer[] = [];
      for await (const chunk of zip.stream) {
        chunks.push(chunk as Buffer);
      }
      const output = Buffer.concat(chunks).toString('binary');

      expect(output).toContain('file-0.txt');
      expect(output).toContain('file-1.txt');
      expect(output).toContain('file-2.txt');
      expect(output).toContain('content-0');
      expect(output).toContain('content-1');
      expect(output).toContain('content-2');
    });
  });
});
