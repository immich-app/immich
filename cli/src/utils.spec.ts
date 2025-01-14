import mockfs from 'mock-fs';
import { readFileSync } from 'node:fs';
import { CrawlOptions, crawl } from 'src/utils';

interface Test {
  test: string;
  options: Omit<CrawlOptions, 'extensions'>;
  files: Record<string, boolean>;
  skipOnWin32?: boolean;
}

const cwd = process.cwd();

const readContent = (path: string) => {
  return readFileSync(path).toString();
};

const extensions = [
  '.jpg',
  '.jpeg',
  '.png',
  '.heif',
  '.heic',
  '.tif',
  '.nef',
  '.webp',
  '.tiff',
  '.dng',
  '.gif',
  '.mov',
  '.mp4',
  '.webm',
];

const tests: Test[] = [
  {
    test: 'should return empty when crawling an empty path list',
    options: {
      pathsToCrawl: [],
    },
    files: {},
  },
  {
    test: 'should crawl a single folder',
    options: {
      pathsToCrawl: ['/photos/'],
    },
    files: {
      '/photos/image.jpg': true,
    },
  },
  {
    test: 'should crawl folders with quotes',
    options: {
      pathsToCrawl: ["/photo's/", '/photo"s/', '/photo`s/'],
    },
    files: {
      "/photo's/image1.jpg": true,
      '/photo"s/image2.jpg': true,
      '/photo`s/image3.jpg': true,
    },
    skipOnWin32: true, // single quote interferes with mockfs root on Windows
  },
  {
    test: 'should crawl a single file',
    options: {
      pathsToCrawl: ['/photos/image.jpg'],
    },
    files: {
      '/photos/image.jpg': true,
    },
  },
  {
    test: 'should crawl a single file and a folder',
    options: {
      pathsToCrawl: ['/photos/image.jpg', '/images/'],
    },
    files: {
      '/photos/image.jpg': true,
      '/images/image2.jpg': true,
    },
  },
  {
    test: 'should exclude by file extension',
    options: {
      pathsToCrawl: ['/photos/'],
      exclusionPattern: '**/*.tif',
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
      exclusionPattern: '**/*.TIF',
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
      exclusionPattern: '**/raw/**',
      recursive: true,
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
      recursive: true,
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
    test: 'should support ignoring full filename',
    options: {
      pathsToCrawl: ['/photos'],
      exclusionPattern: '**/image2.jpg',
    },
    files: {
      '/photos/image1.jpg': true,
      '/photos/image2.jpg': false,
      '/photos/image3.jpg': true,
    },
  },
  {
    test: 'should support ignoring file extensions',
    options: {
      pathsToCrawl: ['/photos'],
      exclusionPattern: '**/*.png',
    },
    files: {
      '/photos/image1.jpg': true,
      '/photos/image2.png': false,
      '/photos/image3.jpg': true,
    },
  },
  {
    test: 'should support ignoring folder names',
    options: {
      pathsToCrawl: ['/photos'],
      recursive: true,
      exclusionPattern: '**/raw/**',
    },
    files: {
      '/photos/image1.jpg': true,
      '/photos/image/image1.jpg': true,
      '/photos/raw/image2.dng': false,
      '/photos/raw/image3.dng': false,
      '/photos/notraw/image3.jpg': true,
    },
  },
  {
    test: 'should support ignoring absolute paths',
    options: {
      // Currently, fast-glob has some caveat when dealing with `/`.
      pathsToCrawl: ['/*s'],
      recursive: true,
      exclusionPattern: '/images/**',
    },
    files: {
      '/photos/image1.jpg': true,
      '/images/image2.jpg': false,
      '/assets/image3.jpg': true,
    },
  },
];

describe('crawl', () => {
  afterEach(() => {
    mockfs.restore();
  });

  describe('crawl', () => {
    for (const { test: name, options, files, skipOnWin32 } of tests) {
      if (process.platform === 'win32' && skipOnWin32) {
        test.skip(name);
        continue;
      }
      it(name, async () => {
        // The file contents is the same as the path.
        mockfs(Object.fromEntries(Object.keys(files).map((file) => [file, file])));

        const actual = await crawl({ ...options, extensions });
        const expected = Object.entries(files)
          .filter((entry) => entry[1])
          .map(([file]) => file);

        // Compare file's content instead of path since a file can be represent in multiple ways.
        expect(actual.map((path) => readContent(path)).sort()).toEqual(expected.sort());
      });
    }
  });
});
