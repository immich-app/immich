import { CrawlOptionsDto } from '@app/domain';
import mockfs from 'mock-fs';
import { FilesystemProvider } from './filesystem.provider';

describe(FilesystemProvider.name, () => {
  const sut: FilesystemProvider = new FilesystemProvider();

  describe('crawl', () => {
    it('should return empty wnen crawling an empty path list', async () => {
      const options = new CrawlOptionsDto();
      options.pathsToCrawl = [];
      const paths: string[] = await sut.crawl(options);
      expect(paths).toHaveLength(0);
    });

    it('should crawl a single path', async () => {
      mockfs({
        '/photos/image.jpg': '',
      });

      const options = new CrawlOptionsDto();
      options.pathsToCrawl = ['/photos/'];
      const paths: string[] = await sut.crawl(options);
      expect(paths.sort()).toEqual(['/photos/image.jpg'].sort());
    });

    it('should exclude by file extension', async () => {
      mockfs({
        '/photos/image.jpg': '',
        '/photos/image.tif': '',
      });

      const options = new CrawlOptionsDto();
      options.pathsToCrawl = ['/photos/'];
      options.exclusionPatterns = ['**/*.tif'];
      const paths: string[] = await sut.crawl(options);
      expect(paths.sort()).toEqual(['/photos/image.jpg'].sort());
    });

    it('should exclude by file extension without case sensitivity', async () => {
      mockfs({
        '/photos/image.jpg': '',
        '/photos/image.tif': '',
      });

      const options = new CrawlOptionsDto();
      options.pathsToCrawl = ['/photos/'];
      options.exclusionPatterns = ['**/*.TIF'];
      const paths: string[] = await sut.crawl(options);
      expect(paths.sort()).toEqual(['/photos/image.jpg'].sort());
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
      options.exclusionPatterns = ['**/raw/**'];
      const paths: string[] = await sut.crawl(options);
      expect(paths.sort()).toEqual(['/photos/image.jpg', '/photos/raw2/image.jpg', '/photos/crawl/image.jpg'].sort());
    });

    it('should crawl multiple paths', async () => {
      mockfs({
        '/photos/image1.jpg': '',
        '/images/image2.jpg': '',
        '/albums/image3.jpg': '',
      });
      const options = new CrawlOptionsDto();
      options.pathsToCrawl = ['/photos/', '/images/', '/albums/'];
      const paths: string[] = await sut.crawl(options);
      expect(paths.sort()).toEqual(['/photos/image1.jpg', '/images/image2.jpg', '/albums/image3.jpg'].sort());
    });

    it('should support globbing paths', async () => {
      mockfs({
        '/photos1/image1.jpg': '',
        '/photos2/image2.jpg': '',
        '/images/image3.jpg': '',
      });
      const options = new CrawlOptionsDto();
      options.pathsToCrawl = ['/photos*'];
      const paths: string[] = await sut.crawl(options);
      expect(paths.sort()).toEqual(['/photos1/image1.jpg', '/photos2/image2.jpg'].sort());
    });

    it('should crawl a single path without trailing slash', async () => {
      mockfs({
        '/photos/image.jpg': '',
      });
      const options = new CrawlOptionsDto();
      options.pathsToCrawl = ['/photos'];
      const paths: string[] = await sut.crawl(options);
      expect(paths.sort()).toEqual(['/photos/image.jpg'].sort());
    });

    // TODO: test for hidden paths (not yet implemented)

    it('should crawl a single path', async () => {
      mockfs({
        '/photos/image.jpg': '',
        '/photos/subfolder/image1.jpg': '',
        '/photos/subfolder/image2.jpg': '',
        '/image1.jpg': '',
      });
      const options = new CrawlOptionsDto();
      options.pathsToCrawl = ['/photos/'];
      const paths: string[] = await sut.crawl(options);
      expect(paths.sort()).toEqual(
        ['/photos/image.jpg', '/photos/subfolder/image1.jpg', '/photos/subfolder/image2.jpg'].sort(),
      );
    });

    it('should filter file extensions', async () => {
      mockfs({
        '/photos/image.jpg': '',
        '/photos/image.txt': '',
        '/photos/1': '',
      });
      const options = new CrawlOptionsDto();
      options.pathsToCrawl = ['/photos/'];
      const paths: string[] = await sut.crawl(options);
      expect(paths.sort()).toEqual(['/photos/image.jpg'].sort());
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
      const paths: string[] = await sut.crawl(options);

      expect(paths.sort()).toEqual(
        [
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
        ].sort(),
      );
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
      const paths: string[] = await sut.crawl(options);
      expect(paths.sort()).toEqual(
        [
          '/photos/image.jpg',
          '/photos/image.Jpg',
          '/photos/image.jpG',
          '/photos/image.JPG',
          '/photos/image.jpEg',
          '/photos/image.TIFF',
          '/photos/image.tif',
          '/photos/image.dng',
          '/photos/image.NEF',
        ].sort(),
      );
    });

    afterEach(() => {
      mockfs.restore();
    });
  });
});
