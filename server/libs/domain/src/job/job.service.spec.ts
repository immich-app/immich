import { AssetEntity, AssetType } from '@app/infra/db/entities';
import {
  newAlbumRepositoryMock,
  newAssetRepositoryMock,
  newJobRepositoryMock,
  newKeyRepositoryMock,
  newStorageRepositoryMock,
  newUserRepositoryMock,
  newUserTokenRepositoryMock,
} from '../../test';
import { IAlbumRepository } from '../album';
import { IKeyRepository } from '../api-key';
import { IAssetRepository } from '../asset';
import { IStorageRepository } from '../storage';
import { IUserRepository } from '../user';
import { IUserTokenRepository } from '../user-token';
import { JobName } from './job.constants';
import { IJobRepository, JobItem } from './job.repository';
import { JobService } from './job.service';

// describe('User Utilities', () => {
//   describe('checkIsReadyForDeletion', () => {
//     it('check that user is not ready to be deleted', () => {
//       const result = userUtils.isReadyForDeletion({ deletedAt: new Date() } as UserEntity);
//       expect(result).toBeFalsy();
//     });

//     it('check that user is ready to be deleted', () => {
//       const aWeekAgo = new Date(new Date().getTime() - 8 * 86400000);
//       const result = userUtils.isReadyForDeletion({ deletedAt: aWeekAgo } as UserEntity);
//       expect(result).toBeTruthy();
//     });
//   });
// });

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
    jobMock = newJobRepositoryMock();
    keyMock = newKeyRepositoryMock();
    storageMock = newStorageRepositoryMock();
    tokenMock = newUserTokenRepositoryMock();
    userMock = newUserRepositoryMock();
    sut = new JobService(albumMock, assetMock, keyMock, jobMock, storageMock, tokenMock, userMock);
  });

  describe('handle', () => {
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
});
