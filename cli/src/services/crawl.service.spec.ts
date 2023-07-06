/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { CrawlService } from './crawl.service';
import mockfs from 'mock-fs';
import { toIncludeSameMembers } from 'jest-extended';
import { CrawlOptionsDto } from '../cores/dto/crawl-options-dto';

const matchers = require('jest-extended');
expect.extend(matchers);

const crawlService = new CrawlService();

describe('CrawlService', () => {
  beforeAll(() => {
    // Write a dummy output before mock-fs to prevent some annoying errors
    console.log();
  });

  it('should crawl a single directory', async () => {
    mockfs({
      '/photos/image.jpg': '',
    });

    const options = new CrawlOptionsDto();
    options.pathsToCrawl = ['/photos/'];
    const paths: string[] = await crawlService.crawl(options);
    expect(paths).toIncludeSameMembers(['/photos/image.jpg']);
  });

  it('should crawl a single file', async () => {
    mockfs({
      '/photos/image.jpg': '',
    });

    const options = new CrawlOptionsDto();
    options.pathsToCrawl = ['/photos/image.jpg'];
    const paths: string[] = await crawlService.crawl(options);
    expect(paths).toIncludeSameMembers(['/photos/image.jpg']);
  });

  it('should crawl a file and a directory', async () => {
    mockfs({
      '/photos/image.jpg': '',
      '/images/photo.jpg': '',
    });

    const options = new CrawlOptionsDto();
    options.pathsToCrawl = ['/photos/image.jpg', '/images/'];
    const paths: string[] = await crawlService.crawl(options);
    expect(paths).toIncludeSameMembers(['/photos/image.jpg', '/images/photo.jpg']);
  });

  it('should exclude by file extension', async () => {
    mockfs({
      '/photos/image.jpg': '',
      '/photos/image.tif': '',
    });

    const options = new CrawlOptionsDto();
    options.pathsToCrawl = ['/photos/'];
    options.excludePatterns = ['**/*.tif'];
    const paths: string[] = await crawlService.crawl(options);
    expect(paths).toIncludeSameMembers(['/photos/image.jpg']);
  });

  it('should exclude by file extension without case sensitivity', async () => {
    mockfs({
      '/photos/image.jpg': '',
      '/photos/image.tif': '',
    });

    const options = new CrawlOptionsDto();
    options.pathsToCrawl = ['/photos/'];
    options.excludePatterns = ['**/*.TIF'];
    const paths: string[] = await crawlService.crawl(options);
    expect(paths).toIncludeSameMembers(['/photos/image.jpg']);
  });

  it('should exclude by folder', async () => {
    mockfs({
      '/photos/image.jpg': '',
      '/photos/raw/image.jpg': '',
      '/photos/raw2/image.jpg': '',
      '/photos/folder/raw/image.jpg': '',
      '/photos/crawl/image.jpg': '',
    });

    const options = new CrawlOptionsDto();
    options.pathsToCrawl = ['/photos/'];
    options.excludePatterns = ['**/raw/**'];
    options.recursive = true;
    const paths: string[] = await crawlService.crawl(options);
    expect(paths).toIncludeSameMembers(['/photos/image.jpg', '/photos/raw2/image.jpg', '/photos/crawl/image.jpg']);
  });

  it('should crawl multiple paths', async () => {
    mockfs({
      '/photos/image1.jpg': '',
      '/images/image2.jpg': '',
      '/albums/image3.jpg': '',
    });
    const options = new CrawlOptionsDto();
    options.pathsToCrawl = ['/photos/', '/images/', '/albums/'];
    options.recursive = false;
    const paths: string[] = await crawlService.crawl(options);
    expect(paths).toIncludeSameMembers(['/photos/image1.jpg', '/images/image2.jpg', '/albums/image3.jpg']);
  });

  it('should crawl a single path without trailing slash', async () => {
    mockfs({
      '/photos/image.jpg': '',
    });
    const options = new CrawlOptionsDto();
    options.pathsToCrawl = ['/photos'];
    const paths: string[] = await crawlService.crawl(options);
    expect(paths).toIncludeSameMembers(['/photos/image.jpg']);
  });

  it('should crawl a single path without recursion', async () => {
    mockfs({
      '/photos/image.jpg': '',
      '/photos/subfolder/image1.jpg': '',
      '/photos/subfolder/image2.jpg': '',
      '/image1.jpg': '',
    });

    const options = new CrawlOptionsDto();
    options.pathsToCrawl = ['/photos/'];
    const paths: string[] = await crawlService.crawl(options);
    expect(paths).toIncludeSameMembers(['/photos/image.jpg']);
  });

  it('should crawl a single path with recursion', async () => {
    mockfs({
      '/photos/image.jpg': '',
      '/photos/subfolder/image1.jpg': '',
      '/photos/subfolder/image2.jpg': '',
      '/image1.jpg': '',
    });
    const options = new CrawlOptionsDto();
    options.pathsToCrawl = ['/photos/'];
    options.recursive = true;
    const paths: string[] = await crawlService.crawl(options);
    expect(paths).toIncludeSameMembers([
      '/photos/image.jpg',
      '/photos/subfolder/image1.jpg',
      '/photos/subfolder/image2.jpg',
    ]);
  });

  it('should filter file extensions', async () => {
    mockfs({
      '/photos/image.jpg': '',
      '/photos/image.txt': '',
      '/photos/1': '',
    });
    const options = new CrawlOptionsDto();
    options.pathsToCrawl = ['/photos/'];
    const paths: string[] = await crawlService.crawl(options);
    expect(paths).toIncludeSameMembers(['/photos/image.jpg']);
  });

  it('should include photo and video extensions', async () => {
    mockfs({
      '/photos/image.jpg': '',
      '/photos/image.jpeg': '',
      '/photos/image.heic': '',
      '/photos/image.heif': '',
      '/photos/image.png': '',
      '/photos/image.gif': '',
      '/photos/image.tif': '',
      '/photos/image.tiff': '',
      '/photos/image.webp': '',
      '/photos/image.dng': '',
      '/photos/image.nef': '',
      '/videos/video.mp4': '',
      '/videos/video.mov': '',
      '/videos/video.webm': '',
    });

    const options = new CrawlOptionsDto();
    options.pathsToCrawl = ['/photos/', '/videos/'];
    const paths: string[] = await crawlService.crawl(options);

    expect(paths).toIncludeSameMembers([
      '/photos/image.jpg',
      '/photos/image.jpeg',
      '/photos/image.heic',
      '/photos/image.heif',
      '/photos/image.png',
      '/photos/image.gif',
      '/photos/image.tif',
      '/photos/image.tiff',
      '/photos/image.webp',
      '/photos/image.dng',
      '/photos/image.nef',
      '/videos/video.mp4',
      '/videos/video.mov',
      '/videos/video.webm',
    ]);
  });

  it('should check file extensions without case sensitivity', async () => {
    mockfs({
      '/photos/image.jpg': '',
      '/photos/image.Jpg': '',
      '/photos/image.jpG': '',
      '/photos/image.JPG': '',
      '/photos/image.jpEg': '',
      '/photos/image.TIFF': '',
      '/photos/image.tif': '',
      '/photos/image.dng': '',
      '/photos/image.NEF': '',
    });

    const options = new CrawlOptionsDto();
    options.pathsToCrawl = ['/photos/'];
    const paths: string[] = await crawlService.crawl(options);
    expect(paths).toIncludeSameMembers([
      '/photos/image.jpg',
      '/photos/image.Jpg',
      '/photos/image.jpG',
      '/photos/image.JPG',
      '/photos/image.jpEg',
      '/photos/image.TIFF',
      '/photos/image.tif',
      '/photos/image.dng',
      '/photos/image.NEF',
    ]);
  });

  afterEach(() => {
    mockfs.restore();
  });
});
