import { UserEntity } from '@app/infra/entities';
import { BadRequestException } from '@nestjs/common';
import {
  assetStub,
  libraryStub,
  newAccessRepositoryMock,
  newAssetRepositoryMock,
  newCryptoRepositoryMock,
  newJobRepositoryMock,
  newLibraryRepositoryMock,
  newUserRepositoryMock,
  userStub,
} from '@test';
import * as matchers from 'jest-extended';
import mockfs from 'mock-fs';
import { IAccessRepository } from '../access';
import { IAssetRepository } from '../asset';
import { ICryptoRepository } from '../crypto';
import { IJobRepository, ILibraryJob, JobName } from '../job';
import { IUserRepository } from '../user';
import { CrawlOptionsDto, ILibraryRepository, LibraryService } from './index';

expect.extend(matchers);

describe(LibraryService.name, () => {
  let sut: LibraryService;

  let accessMock: jest.Mocked<IAccessRepository>;
  let libraryMock: jest.Mocked<ILibraryRepository>;
  let assetMock: jest.Mocked<IAssetRepository>;
  let userMock: jest.Mocked<IUserRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let cryptoMock: jest.Mocked<ICryptoRepository>;

  const createLibraryService = () => {
    // We can't import library service the normal way due to some mocking load order issues

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { LibraryService } = require('./library.service');

    sut = new LibraryService(accessMock, userMock, libraryMock, assetMock, jobMock, cryptoMock);
  };

  beforeEach(() => {
    accessMock = newAccessRepositoryMock();
    libraryMock = newLibraryRepositoryMock();
    userMock = newUserRepositoryMock();
    assetMock = newAssetRepositoryMock();
    jobMock = newJobRepositoryMock();
    cryptoMock = newCryptoRepositoryMock();
  });

  it('should work', () => {
    createLibraryService();

    expect(sut).toBeDefined();
  });

  describe('handleRefreshAsset', () => {
    let mockUser: UserEntity;

    afterEach(() => {
      mockfs.restore();
    });

    beforeEach(() => {
      jest.resetModules();

      mockUser = userStub.externalPath;
      userMock.get.mockResolvedValue(mockUser);
    });

    it('should reject an unknown file extension', async () => {
      mockfs({
        '/data/user1/file.xyz': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
      });

      createLibraryService();

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryStub.importLibrary.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/file.xyz',
        analyze: false,
        emptyTrash: false,
      };

      await expect(async () => {
        await sut.handleRefreshAsset(mockLibraryJob);
      }).rejects.toThrowError('Unsupported file type /data/user1/file.xyz');
    });

    it('should add a new image', async () => {
      mockfs({
        '/data/user1/photo.jpg': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
      });

      createLibraryService();

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryStub.importLibrary.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
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
        '/data/user1/video.mp4': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
      });

      createLibraryService();

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryStub.importLibrary.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/video.mp4',
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

    it('should reject an asset if the user cannot be found', async () => {
      mockfs({
        '/data/user1/photo.jpg': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
      });

      createLibraryService();

      userMock.get.mockResolvedValue(null);

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryStub.importLibrary.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
        analyze: false,
        emptyTrash: false,
      };

      expect(sut.handleRefreshAsset(mockLibraryJob)).rejects.toThrow(
        new BadRequestException("User has no external path set, can't import asset"),
      );
    });

    it('should reject an asset if external path is not set', async () => {
      mockfs({
        '/data/user1/photo.jpg': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
      });

      createLibraryService();

      mockUser = userStub.admin;
      userMock.get.mockResolvedValue(mockUser);

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryStub.importLibrary.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
        analyze: false,
        emptyTrash: false,
      };

      expect(sut.handleRefreshAsset(mockLibraryJob)).rejects.toThrow(
        new BadRequestException("User has no external path set, can't import asset"),
      );
    });

    it("should reject an asset if it isn't in the external path", async () => {
      mockfs({
        '/etc/rootpassword.jpg': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
      });

      createLibraryService();

      mockUser = userStub.externalPath;
      userMock.get.mockResolvedValue(mockUser);

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryStub.importLibrary.id,
        ownerId: mockUser.id,
        assetPath: '/etc/rootpassword.jpg',
        analyze: false,
        emptyTrash: false,
      };

      expect(sut.handleRefreshAsset(mockLibraryJob)).rejects.toThrow(
        new BadRequestException("Asset must be within the user's external path"),
      );
    });

    it('should reject an asset if directory traversal is attempted', async () => {
      mockfs({
        '/etc/rootpassword.jpg': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
      });

      createLibraryService();

      mockUser = userStub.externalPath;
      userMock.get.mockResolvedValue(mockUser);

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryStub.importLibrary.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/../../etc/rootpassword.jpg',
        analyze: false,
        emptyTrash: false,
      };

      expect(sut.handleRefreshAsset(mockLibraryJob)).rejects.toThrow(
        new BadRequestException("Asset must be within the user's external path"),
      );
    });

    it('should offline a missing asset', async () => {
      mockfs({});

      createLibraryService();

      const mockLibraryJob: ILibraryJob = {
        libraryId: assetStub.image.libraryId,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
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
        '/data/user1/photo.jpg': mockfs.file({
          content: Buffer.from([8, 6, 7, 5, 3, 0, 9]),
          ctime: new Date(1),
          mtime: new Date(1),
        }),
      });

      createLibraryService();

      const mockLibraryJob: ILibraryJob = {
        libraryId: assetStub.offlineImage.libraryId,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
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
        '/data/user1/photo.jpg': mockfs.file({
          content: Buffer.from([8, 6, 7, 5, 3, 0, 9]),
          ctime: new Date(1),
          mtime: assetStub.image.fileModifiedAt,
        }),
      });

      createLibraryService();

      const mockLibraryJob: ILibraryJob = {
        libraryId: assetStub.image.libraryId,
        ownerId: assetStub.image.ownerId,
        assetPath: '/data/user1/photo.jpg',
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
        '/data/user1/photo.jpg': mockfs.file({
          content: Buffer.from([8, 6, 7, 5, 3, 0, 9]),
          ctime: new Date(1),
          mtime: filemtime,
        }),
      });

      createLibraryService();

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryStub.importLibrary.id,
        ownerId: userStub.admin.id,
        assetPath: '/data/user1/photo.jpg',
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

      createLibraryService();

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryStub.importLibrary.id,
        ownerId: userStub.admin.id,
        assetPath: '/data/user1/photo.jpg',
        analyze: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.image);

      await expect(async () => {
        await sut.handleRefreshAsset(mockLibraryJob);
      }).rejects.toThrowError("ENOENT, no such file or directory '/data/user1/photo.jpg'");
    });
  });

  describe('crawl', () => {
    beforeAll(() => {
      // Write a dummy output before mock-fs to prevent some annoying errors
      console.log();

      createLibraryService();
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
      options.exclusionPatterns = ['**/*.tif'];
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
      options.exclusionPatterns = ['**/*.TIF'];
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
      options.exclusionPatterns = ['**/raw/**'];
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
