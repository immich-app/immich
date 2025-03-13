import { BadRequestException } from '@nestjs/common';
import { FileReportItemDto } from 'src/dtos/audit.dto';
import { AssetFileType, AssetPathType, JobStatus, PersonPathType, UserPathType } from 'src/enum';
import { AuditService } from 'src/services/audit.service';
import { newTestService, ServiceMocks } from 'test/utils';

describe(AuditService.name, () => {
  let sut: AuditService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(AuditService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('handleCleanup', () => {
    it('should delete old audit entries', async () => {
      mocks.audit.removeBefore.mockResolvedValue();

      await expect(sut.handleCleanup()).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.audit.removeBefore).toHaveBeenCalledWith(expect.any(Date));
    });
  });

  describe('getChecksums', () => {
    it('should fail if the file is not in the immich path', async () => {
      await expect(sut.getChecksums({ filenames: ['foo/bar'] })).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.crypto.hashFile).not.toHaveBeenCalled();
    });

    it('should get checksum for valid file', async () => {
      await expect(sut.getChecksums({ filenames: ['./upload/my-file.jpg'] })).resolves.toEqual([
        { filename: './upload/my-file.jpg', checksum: expect.any(String) },
      ]);

      expect(mocks.crypto.hashFile).toHaveBeenCalledWith('./upload/my-file.jpg');
    });
  });

  describe('fixItems', () => {
    it('should fail if the file is not in the immich path', async () => {
      await expect(
        sut.fixItems([
          { entityId: 'my-id', pathType: AssetPathType.ORIGINAL, pathValue: 'foo/bar' } as FileReportItemDto,
        ]),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.asset.update).not.toHaveBeenCalled();
      expect(mocks.asset.upsertFile).not.toHaveBeenCalled();
      expect(mocks.person.update).not.toHaveBeenCalled();
      expect(mocks.user.update).not.toHaveBeenCalled();
    });

    it('should update encoded video path', async () => {
      await sut.fixItems([
        {
          entityId: 'my-id',
          pathType: AssetPathType.ENCODED_VIDEO,
          pathValue: './upload/my-video.mp4',
        } as FileReportItemDto,
      ]);

      expect(mocks.asset.update).toHaveBeenCalledWith({ id: 'my-id', encodedVideoPath: './upload/my-video.mp4' });
      expect(mocks.asset.upsertFile).not.toHaveBeenCalled();
      expect(mocks.person.update).not.toHaveBeenCalled();
      expect(mocks.user.update).not.toHaveBeenCalled();
    });

    it('should update preview path', async () => {
      await sut.fixItems([
        {
          entityId: 'my-id',
          pathType: AssetPathType.PREVIEW,
          pathValue: './upload/my-preview.png',
        } as FileReportItemDto,
      ]);

      expect(mocks.asset.upsertFile).toHaveBeenCalledWith({
        assetId: 'my-id',
        type: AssetFileType.PREVIEW,
        path: './upload/my-preview.png',
      });
      expect(mocks.asset.update).not.toHaveBeenCalled();
      expect(mocks.person.update).not.toHaveBeenCalled();
      expect(mocks.user.update).not.toHaveBeenCalled();
    });

    it('should update thumbnail path', async () => {
      await sut.fixItems([
        {
          entityId: 'my-id',
          pathType: AssetPathType.THUMBNAIL,
          pathValue: './upload/my-thumbnail.webp',
        } as FileReportItemDto,
      ]);

      expect(mocks.asset.upsertFile).toHaveBeenCalledWith({
        assetId: 'my-id',
        type: AssetFileType.THUMBNAIL,
        path: './upload/my-thumbnail.webp',
      });
      expect(mocks.asset.update).not.toHaveBeenCalled();
      expect(mocks.person.update).not.toHaveBeenCalled();
      expect(mocks.user.update).not.toHaveBeenCalled();
    });

    it('should update original path', async () => {
      await sut.fixItems([
        {
          entityId: 'my-id',
          pathType: AssetPathType.ORIGINAL,
          pathValue: './upload/my-original.png',
        } as FileReportItemDto,
      ]);

      expect(mocks.asset.update).toHaveBeenCalledWith({ id: 'my-id', originalPath: './upload/my-original.png' });
      expect(mocks.asset.upsertFile).not.toHaveBeenCalled();
      expect(mocks.person.update).not.toHaveBeenCalled();
      expect(mocks.user.update).not.toHaveBeenCalled();
    });

    it('should update sidecar path', async () => {
      await sut.fixItems([
        {
          entityId: 'my-id',
          pathType: AssetPathType.SIDECAR,
          pathValue: './upload/my-sidecar.xmp',
        } as FileReportItemDto,
      ]);

      expect(mocks.asset.update).toHaveBeenCalledWith({ id: 'my-id', sidecarPath: './upload/my-sidecar.xmp' });
      expect(mocks.asset.upsertFile).not.toHaveBeenCalled();
      expect(mocks.person.update).not.toHaveBeenCalled();
      expect(mocks.user.update).not.toHaveBeenCalled();
    });

    it('should update face path', async () => {
      await sut.fixItems([
        {
          entityId: 'my-id',
          pathType: PersonPathType.FACE,
          pathValue: './upload/my-face.jpg',
        } as FileReportItemDto,
      ]);

      expect(mocks.person.update).toHaveBeenCalledWith({ id: 'my-id', thumbnailPath: './upload/my-face.jpg' });
      expect(mocks.asset.update).not.toHaveBeenCalled();
      expect(mocks.asset.upsertFile).not.toHaveBeenCalled();
      expect(mocks.user.update).not.toHaveBeenCalled();
    });

    it('should update profile path', async () => {
      await sut.fixItems([
        {
          entityId: 'my-id',
          pathType: UserPathType.PROFILE,
          pathValue: './upload/my-profile-pic.jpg',
        } as FileReportItemDto,
      ]);

      expect(mocks.user.update).toHaveBeenCalledWith('my-id', { profileImagePath: './upload/my-profile-pic.jpg' });
      expect(mocks.asset.update).not.toHaveBeenCalled();
      expect(mocks.asset.upsertFile).not.toHaveBeenCalled();
      expect(mocks.person.update).not.toHaveBeenCalled();
    });
  });
});
