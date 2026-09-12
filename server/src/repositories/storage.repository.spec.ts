import mockfs from 'mock-fs';
import { CrawlOptionsDto } from 'src/dtos/library.dto.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { StorageRepository } from 'src/repositories/storage.repository.js';
import { automock } from 'test/utils.js';
import { vitest } from 'vitest';

const mocks = vitest.hoisted(() => {
  const watcher = {
    close: vitest.fn(),
    on: vitest.fn(),
  };
  watcher.on.mockReturnValue(watcher);

  return { watch: vitest.fn(() => watcher), watcher };
});

vitest.mock('chokidar', () => ({ default: { watch: mocks.watch } }));

const getHandler = (event: string) => {
  const handler = mocks.watcher.on.mock.calls.find(([name]) => name === event)?.[1];
  if (!handler) {
    throw new Error(`Missing ${event} handler`);
  }
  return handler;
};

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
    mocks.watch.mockReset().mockReturnValue(mocks.watcher);
    mocks.watcher.on.mockReset().mockReturnValue(mocks.watcher);
    mocks.watcher.close.mockReset().mockResolvedValue(undefined);
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

  describe('watch', () => {
    it('should register event handlers and close the watcher', async () => {
      const onReady = vitest.fn();
      const onAdd = vitest.fn();
      const onChange = vitest.fn();
      const onUnlink = vitest.fn();
      const onError = vitest.fn();
      const close = sut.watch(['/photos'], {}, { onAdd, onChange, onError, onReady, onUnlink });

      expect(mocks.watch).toHaveBeenCalledWith(['/photos'], expect.objectContaining({ ignored: expect.any(Function) }));

      const error = new Error('watch error');
      getHandler('ready')();
      getHandler('add')('/photos/add.jpg');
      getHandler('change')('/photos/change.jpg');
      getHandler('unlink')('/photos/unlink.jpg');
      getHandler('error')(error);

      expect(onReady).toHaveBeenCalledWith();
      expect(onAdd).toHaveBeenCalledWith('/photos/add.jpg');
      expect(onChange).toHaveBeenCalledWith('/photos/change.jpg');
      expect(onUnlink).toHaveBeenCalledWith('/photos/unlink.jpg');
      expect(onError).toHaveBeenCalledWith(error);

      await close();
      expect(mocks.watcher.close).toHaveBeenCalledWith();
    });

    it('should convert ignored glob arrays to a case-insensitive matcher', () => {
      sut.watch(['/photos'], { ignored: ['**/excluded/**'] }, {});
      const [, options] = mocks.watch.mock.lastCall as unknown as [string[], { ignored?: unknown }];
      const ignored = options.ignored as (path: string) => boolean;

      expect(typeof ignored).toBe('function');
      expect(ignored('/photos/EXCLUDED/photo.jpg')).toBe(true);
      expect(ignored('/photos/included/photo.jpg')).toBe(false);
    });

    it('should tolerate missing event callbacks', () => {
      sut.watch(['/photos'], {}, {});

      expect(() => {
        getHandler('ready')();
        getHandler('add')('/photos/add.jpg');
        getHandler('change')('/photos/change.jpg');
        getHandler('unlink')('/photos/unlink.jpg');
        getHandler('error')(new Error('watch error'));
      }).not.toThrow();
    });
  });
});
