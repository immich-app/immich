import {
  assetStub,
  libraryStub,
  newAccessRepositoryMock,
  newAssetRepositoryMock,
  newCryptoRepositoryMock,
  newJobRepositoryMock,
  newLibraryRepositoryMock,
  userStub,
} from '@test';
import * as matchers from 'jest-extended';
import mockfs from 'mock-fs';
import { IAccessRepository } from '../access';
import { IAssetRepository } from '../asset';
import { ICryptoRepository } from '../crypto';
import { IJobRepository, ILibraryJob, JobName } from '../job';
import { CrawlOptionsDto, ILibraryRepository, LibraryService } from './index';

expect.extend(matchers);

describe(LibraryService.name, () => {
  let sut: LibraryService;

  let accessMock: jest.Mocked<IAccessRepository>;
  let libraryMock: jest.Mocked<ILibraryRepository>;
  let assetMock: jest.Mocked<IAssetRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let cryptoMock: jest.Mocked<ICryptoRepository>;

  const createLibraryService = () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { LibraryService } = require('./library.service');

    sut = new LibraryService(accessMock, libraryMock, assetMock, jobMock, cryptoMock);
  };

  beforeEach(() => {
    accessMock = newAccessRepositoryMock();
    libraryMock = newLibraryRepositoryMock();
    assetMock = newAssetRepositoryMock();
    jobMock = newJobRepositoryMock();
    cryptoMock = newCryptoRepositoryMock();

    createLibraryService();
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('handleRefreshAsset', () => {
    afterEach(() => {
      mockfs.restore();
    });

    beforeEach(() => {
      jest.resetModules();
    });

    it('should reject an unknown file extension', async () => {
      jest.mock('mime', () => ({
        lookup: jest.fn().mockReturnValue(null),
      }));

      mockfs({
        '/import/file.xyz': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
      });

      createLibraryService();

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryStub.importLibrary.id,
        ownerId: userStub.admin.id,
        assetPath: '/import/file.xyz',
        analyze: false,
        emptyTrash: false,
      };

      await expect(async () => {
        await sut.handleRefreshAsset(mockLibraryJob);
      }).rejects.toThrowError('Unsupported file type /import/file.xyz');
    });

    it('should add a new image', async () => {
      mockfs({
        '/import/photo.jpg': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
      });

      jest.mock('mime', () => ({
        lookup: jest.fn().mockReturnValue('image/jpeg'),
      }));

      createLibraryService();

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryStub.importLibrary.id,
        ownerId: userStub.admin.id,
        assetPath: '/import/photo.jpg',
        analyze: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.image);

      await expect(sut.handleRefreshAsset(mockLibraryJob)).resolves.toBe(true);

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.METADATA_EXTRACTION,
        data: {
          id: assetStub.image.id,
          source: 'upload',
        },
      });

      expect(jobMock.queue).not.toHaveBeenCalledWith({
        name: JobName.VIDEO_CONVERSION,
        data: {
          id: assetStub.image.id,
        },
      });
    });

    it('should add a new video', async () => {
      mockfs({
        '/import/video.mp4': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
      });

      jest.mock('mime', () => ({
        lookup: jest.fn().mockReturnValue('video/mp4'),
      }));

      createLibraryService();

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryStub.importLibrary.id,
        ownerId: userStub.admin.id,
        assetPath: '/import/video.mp4',
        analyze: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.video);

      await expect(sut.handleRefreshAsset(mockLibraryJob)).resolves.toBe(true);

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.METADATA_EXTRACTION,
        data: {
          id: assetStub.video.id,
          source: 'upload',
        },
      });

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.VIDEO_CONVERSION,
        data: {
          id: assetStub.video.id,
        },
      });
    });

    it('should offline a missing asset', async () => {
      mockfs({});

      jest.mock('mime', () => ({
        lookup: jest.fn().mockReturnValue('image/jpeg'),
      }));

      createLibraryService();

      const mockLibraryJob: ILibraryJob = {
        libraryId: assetStub.image.libraryId,
        ownerId: assetStub.image.ownerId,
        assetPath: '/import/photo.jpg',
        analyze: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      assetMock.create.mockResolvedValue(assetStub.image);

      await expect(sut.handleRefreshAsset(mockLibraryJob)).resolves.toBe(true);

      expect(assetMock.save).toHaveBeenCalledWith({ id: assetStub.image.id, isOffline: true });

      expect(jobMock.queue).not.toHaveBeenCalled();
    });

    it('should online a previously-offline asset', async () => {
      mockfs({
        '/import/photo.jpg': mockfs.file({
          content: Buffer.from([8, 6, 7, 5, 3, 0, 9]),
          ctime: new Date(1),
          mtime: new Date(1),
        }),
      });

      jest.mock('mime', () => ({
        lookup: jest.fn().mockReturnValue('image/jpeg'),
      }));

      createLibraryService();

      const mockLibraryJob: ILibraryJob = {
        libraryId: assetStub.offlineImage.libraryId,
        ownerId: assetStub.offlineImage.ownerId,
        assetPath: '/import/photo.jpg',
        analyze: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.offlineImage);
      assetMock.create.mockResolvedValue(assetStub.offlineImage);

      await expect(sut.handleRefreshAsset(mockLibraryJob)).resolves.toBe(true);

      expect(assetMock.save).toHaveBeenCalledWith({ id: assetStub.offlineImage.id, isOffline: false });

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.METADATA_EXTRACTION,
        data: {
          id: assetStub.offlineImage.id,
          source: 'upload',
        },
      });

      expect(jobMock.queue).not.toHaveBeenCalledWith({
        name: JobName.VIDEO_CONVERSION,
        data: {
          id: assetStub.offlineImage.id,
        },
      });
    });

    it('should do nothing when mtime matches existing asset', async () => {
      mockfs({
        '/import/photo.jpg': mockfs.file({
          content: Buffer.from([8, 6, 7, 5, 3, 0, 9]),
          ctime: new Date(1),
          mtime: assetStub.image.fileModifiedAt,
        }),
      });

      jest.mock('mime', () => ({
        lookup: jest.fn().mockReturnValue('image/jpeg'),
      }));

      createLibraryService();

      const mockLibraryJob: ILibraryJob = {
        libraryId: assetStub.image.libraryId,
        ownerId: assetStub.image.ownerId,
        assetPath: '/import/photo.jpg',
        analyze: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      assetMock.create.mockResolvedValue(assetStub.image);

      expect(assetMock.save).not.toHaveBeenCalled();

      await expect(sut.handleRefreshAsset(mockLibraryJob)).resolves.toBe(true);
    });

    it('should refresh an existing asset with modified mtime', async () => {
      const filemtime = new Date();
      filemtime.setSeconds(assetStub.image.fileModifiedAt.getSeconds() + 10);
      mockfs({
        '/import/photo.jpg': mockfs.file({
          content: Buffer.from([8, 6, 7, 5, 3, 0, 9]),
          ctime: new Date(1),
          mtime: filemtime,
        }),
      });

      jest.mock('mime', () => ({
        lookup: jest.fn().mockReturnValue('image/jpeg'),
      }));

      createLibraryService();

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryStub.importLibrary.id,
        ownerId: userStub.admin.id,
        assetPath: '/import/photo.jpg',
        analyze: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      assetMock.create.mockResolvedValue(assetStub.image);

      await expect(sut.handleRefreshAsset(mockLibraryJob)).resolves.toBe(true);

      expect(assetMock.create).toHaveBeenCalled();
      const createdAsset = assetMock.create.mock.calls[0][0];

      expect(createdAsset.fileModifiedAt).toEqual(filemtime);
    });

    it('should error when asset does not exist', async () => {
      mockfs({});

      jest.mock('mime', () => ({
        lookup: jest.fn().mockReturnValue('image/jpeg'),
      }));

      createLibraryService();

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryStub.importLibrary.id,
        ownerId: userStub.admin.id,
        assetPath: '/import/photo.jpg',
        analyze: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.image);

      await expect(async () => {
        await sut.handleRefreshAsset(mockLibraryJob);
      }).rejects.toThrowError("ENOENT, no such file or directory '/import/photo.jpg'");
    });
  });

  describe('crawl', () => {
    beforeAll(() => {
      // Write a dummy output before mock-fs to prevent some annoying errors
      console.log();
    });

    it('should return empty wnen crawling an empty path list', async () => {
      const options = new CrawlOptionsDto();
      options.pathsToCrawl = [];
      const paths: string[] = await sut.crawl(options);
      expect(paths).toBeEmpty();
    });

    it('should crawl a single path', async () => {
      mockfs({
        '/photos/image.jpg': '',
      });

      const options = new CrawlOptionsDto();
      options.pathsToCrawl = ['/photos/'];
      const paths: string[] = await sut.crawl(options);
      expect(paths).toIncludeSameMembers(['/photos/image.jpg']);
    });

    it('should exclude by file extension', async () => {
      mockfs({
        '/photos/image.jpg': '',
        '/photos/image.tif': '',
      });

      const options = new CrawlOptionsDto();
      options.pathsToCrawl = ['/photos/'];
      options.excludePatterns = ['**/*.tif'];
      const paths: string[] = await sut.crawl(options);
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
      const paths: string[] = await sut.crawl(options);
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
      const paths: string[] = await sut.crawl(options);
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
      const paths: string[] = await sut.crawl(options);
      expect(paths).toIncludeSameMembers(['/photos/image1.jpg', '/images/image2.jpg', '/albums/image3.jpg']);
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
      expect(paths).toIncludeSameMembers(['/photos1/image1.jpg', '/photos2/image2.jpg']);
    });

    it('should crawl a single path without trailing slash', async () => {
      mockfs({
        '/photos/image.jpg': '',
      });
      const options = new CrawlOptionsDto();
      options.pathsToCrawl = ['/photos'];
      const paths: string[] = await sut.crawl(options);
      expect(paths).toIncludeSameMembers(['/photos/image.jpg']);
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
      const paths: string[] = await sut.crawl(options);
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
      const paths: string[] = await sut.crawl(options);

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
      const paths: string[] = await sut.crawl(options);
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
});
