import { AssetEntity, AssetType, UserEntity } from '@app/infra/db/entities';
import { when } from 'jest-when';
import {
  assetEntityStub,
  newAlbumRepositoryMock,
  newAssetRepositoryMock,
  newJobRepositoryMock,
  newKeyRepositoryMock,
  newStorageRepositoryMock,
  newSystemConfigRepositoryMock,
  newUserRepositoryMock,
  newUserTokenRepositoryMock,
  systemConfigStub,
} from '../../test';
import { IAlbumRepository } from '../album';
import { IKeyRepository } from '../api-key';
import { IAssetRepository } from '../asset';
import { IStorageRepository } from '../storage';
import { ISystemConfigRepository } from '../system-config';
import { IUserRepository } from '../user';
import { IUserTokenRepository } from '../user-token';
import { JobName } from './job.constants';
import { IJobRepository, JobItem } from './job.repository';
import { JobService } from './job.service';

const makeDeletedAt = (daysAgo: number) => {
  const deletedAt = new Date();
  deletedAt.setDate(deletedAt.getDate() - daysAgo);
  return deletedAt;
};

const jobStub = {
  upload: {
    video: Object.freeze<JobItem>({
      name: JobName.ASSET_UPLOADED,
      data: { asset: { type: AssetType.VIDEO } as AssetEntity, fileName: 'video.mp4' },
    }),
    image: Object.freeze<JobItem>({
      name: JobName.ASSET_UPLOADED,
      data: { asset: { type: AssetType.IMAGE } as AssetEntity, fileName: 'image.jpg' },
    }),
  },
};

describe(JobService.name, () => {
  let sut: JobService;
  let albumMock: jest.Mocked<IAlbumRepository>;
  let assetMock: jest.Mocked<IAssetRepository>;
  let configMock: jest.Mocked<ISystemConfigRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let keyMock: jest.Mocked<IKeyRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;
  let tokenMock: jest.Mocked<IUserTokenRepository>;
  let userMock: jest.Mocked<IUserRepository>;

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  beforeEach(async () => {
    albumMock = newAlbumRepositoryMock();
    assetMock = newAssetRepositoryMock();
    configMock = newSystemConfigRepositoryMock();
    jobMock = newJobRepositoryMock();
    keyMock = newKeyRepositoryMock();
    storageMock = newStorageRepositoryMock();
    tokenMock = newUserTokenRepositoryMock();
    userMock = newUserRepositoryMock();
    sut = new JobService(
      albumMock,
      assetMock,
      configMock,
      keyMock,
      jobMock,
      storageMock,
      tokenMock,
      userMock,
      systemConfigStub.defaults,
    );
  });

  describe(`handle asset upload`, () => {
    it('should process an uploaded video', async () => {
      await expect(sut.handle(jobStub.upload.video)).resolves.toBeUndefined();

      expect(jobMock.queue).toHaveBeenCalledTimes(3);
      expect(jobMock.queue.mock.calls).toEqual([
        [{ name: JobName.GENERATE_JPEG_THUMBNAIL, data: { asset: { type: AssetType.VIDEO } } }],
        [{ name: JobName.VIDEO_CONVERSION, data: { asset: { type: AssetType.VIDEO } } }],
        [{ name: JobName.EXTRACT_VIDEO_METADATA, data: { asset: { type: AssetType.VIDEO }, fileName: 'video.mp4' } }],
      ]);
    });

    it('should process an uploaded image', async () => {
      await sut.handle(jobStub.upload.image);

      expect(jobMock.queue).toHaveBeenCalledTimes(2);
      expect(jobMock.queue.mock.calls).toEqual([
        [{ name: JobName.GENERATE_JPEG_THUMBNAIL, data: { asset: { type: AssetType.IMAGE } } }],
        [{ name: JobName.EXIF_EXTRACTION, data: { asset: { type: AssetType.IMAGE }, fileName: 'image.jpg' } }],
      ]);
    });
  });

  describe('handle config change', () => {
    it('should update the config', async () => {
      await sut.handle({ name: JobName.CONFIG_CHANGE });

      expect(configMock.load).toHaveBeenCalled();
    });
  });

  describe('handle user delete check', () => {
    it('should skip users not ready for deletion', async () => {
      userMock.getDeletedUsers.mockResolvedValue([
        {},
        { deletedAt: undefined },
        { deletedAt: null },
        { deletedAt: makeDeletedAt(5) },
      ] as UserEntity[]);

      await sut.handle({ name: JobName.USER_DELETE_CHECK });

      expect(userMock.getDeletedUsers).toHaveBeenCalled();
      expect(jobMock.queue).not.toHaveBeenCalled();
    });

    it('should queue user ready for deletion', async () => {
      const user = { deletedAt: makeDeletedAt(10) };
      userMock.getDeletedUsers.mockResolvedValue([user] as UserEntity[]);

      await sut.handle({ name: JobName.USER_DELETE_CHECK });

      expect(userMock.getDeletedUsers).toHaveBeenCalled();
      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.USER_DELETION, data: { user } });
    });
  });

  describe('handle user delete', () => {
    it('should skip users not ready for deletion', async () => {
      const user = { deletedAt: makeDeletedAt(5) } as UserEntity;

      await sut.handle({ name: JobName.USER_DELETION, data: { user } });

      expect(storageMock.unlinkDir).not.toHaveBeenCalled();
      expect(userMock.delete).not.toHaveBeenCalled();
    });

    it('should delete the user and associated assets', async () => {
      const user = { id: 'deleted-user', deletedAt: makeDeletedAt(10) } as UserEntity;

      await sut.handle({ name: JobName.USER_DELETION, data: { user } });

      expect(storageMock.unlinkDir).toHaveBeenCalledWith('upload/deleted-user', { force: true, recursive: true });
      expect(tokenMock.deleteAll).toHaveBeenCalledWith(user.id);
      expect(keyMock.deleteAll).toHaveBeenCalledWith(user.id);
      expect(albumMock.deleteAll).toHaveBeenCalledWith(user.id);
      expect(assetMock.deleteAll).toHaveBeenCalledWith(user.id);
      expect(userMock.delete).toHaveBeenCalledWith(user, true);
    });

    it('should handle an error', async () => {
      const user = { id: 'deleted-user', deletedAt: makeDeletedAt(10) } as UserEntity;

      storageMock.unlinkDir.mockRejectedValue(new Error('Read only filesystem'));

      await sut.handle({ name: JobName.USER_DELETION, data: { user } });

      expect(userMock.delete).not.toHaveBeenCalled();
    });
  });

  describe('handle delete files', () => {
    it('should handle null values', async () => {
      await sut.handle({ name: JobName.DELETE_FILES, data: { files: [undefined, null] } });

      expect(storageMock.unlink).not.toHaveBeenCalled();
    });

    it('should handle an error removing a file', async () => {
      storageMock.unlink.mockRejectedValue(new Error('something-went-wrong'));

      await sut.handle({ name: JobName.DELETE_FILES, data: { files: ['path/to/something'] } });

      expect(storageMock.unlink).toHaveBeenCalledWith('path/to/something');
    });

    it('should remove the file', async () => {
      await sut.handle({ name: JobName.DELETE_FILES, data: { files: ['path/to/something'] } });

      expect(storageMock.unlink).toHaveBeenCalledWith('path/to/something');
    });
  });

  describe('handle template migration', () => {
    it('should handle no assets', async () => {
      assetMock.getAll.mockResolvedValue([]);

      await sut.handle({ name: JobName.TEMPLATE_MIGRATION });

      expect(assetMock.getAll).toHaveBeenCalled();
    });

    it('should handle an asset with a duplicate destination', async () => {
      assetMock.getAll.mockResolvedValue([assetEntityStub.image]);

      when(storageMock.checkFileExists)
        .calledWith('upload/user-id/2023/2023-02-23/asset-id.ext')
        .mockResolvedValue(true);

      when(storageMock.checkFileExists)
        .calledWith('upload/user-id/2023/2023-02-23/asset-id+1.ext')
        .mockResolvedValue(false);

      await sut.handle({ name: JobName.TEMPLATE_MIGRATION });

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.checkFileExists).toHaveBeenCalledTimes(2);
    });

    it('should skip when an asset already matches the template', async () => {
      assetMock.getAll.mockResolvedValue([
        {
          ...assetEntityStub.image,
          originalPath: 'upload/user-id/2023/2023-02-23/asset-id.ext',
        },
      ]);

      await sut.handle({ name: JobName.TEMPLATE_MIGRATION });

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.moveFile).not.toHaveBeenCalled();
      expect(storageMock.checkFileExists).not.toHaveBeenCalledTimes(2);
      expect(assetMock.save).not.toHaveBeenCalled();
    });

    it('should skip when an asset is probably a duplicate', async () => {
      assetMock.getAll.mockResolvedValue([
        {
          ...assetEntityStub.image,
          originalPath: 'upload/user-id/2023/2023-02-23/asset-id+1.ext',
        },
      ]);

      await sut.handle({ name: JobName.TEMPLATE_MIGRATION });

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.moveFile).not.toHaveBeenCalled();
      expect(storageMock.checkFileExists).not.toHaveBeenCalledTimes(2);
      expect(assetMock.save).not.toHaveBeenCalled();
    });

    it('should move an asset', async () => {
      assetMock.getAll.mockResolvedValue([assetEntityStub.image]);
      assetMock.save.mockResolvedValue(assetEntityStub.image);

      await sut.handle({ name: JobName.TEMPLATE_MIGRATION });

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.moveFile).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/user-id/2023/2023-02-23/asset-id.ext',
      );
      expect(assetMock.save).toHaveBeenCalledWith({
        id: assetEntityStub.image.id,
        originalPath: 'upload/user-id/2023/2023-02-23/asset-id.ext',
      });
    });

    it('should not update the database if the move fails', async () => {
      assetMock.getAll.mockResolvedValue([assetEntityStub.image]);
      storageMock.moveFile.mockRejectedValue(new Error('Read only system'));

      await sut.handle({ name: JobName.TEMPLATE_MIGRATION });

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.moveFile).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/user-id/2023/2023-02-23/asset-id.ext',
      );
      expect(assetMock.save).not.toHaveBeenCalled();
    });

    it('should move the asset back if the database fails', async () => {
      assetMock.getAll.mockResolvedValue([assetEntityStub.image]);
      assetMock.save.mockRejectedValue('Connection Error!');

      await sut.handle({ name: JobName.TEMPLATE_MIGRATION });

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(assetMock.save).toHaveBeenCalledWith({
        id: assetEntityStub.image.id,
        originalPath: 'upload/user-id/2023/2023-02-23/asset-id.ext',
      });
      expect(storageMock.moveFile.mock.calls).toEqual([
        ['/original/path.ext', 'upload/user-id/2023/2023-02-23/asset-id.ext'],
        ['upload/user-id/2023/2023-02-23/asset-id.ext', '/original/path.ext'],
      ]);
    });
  });

  it('should handle an error', async () => {
    assetMock.getAll.mockResolvedValue([]);
    storageMock.removeEmptyDirs.mockRejectedValue(new Error('Read only filesystem'));

    await sut.handle({ name: JobName.TEMPLATE_MIGRATION });
  });
});
