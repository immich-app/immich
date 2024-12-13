import { BadRequestException } from '@nestjs/common';
import { FileReportItemDto } from 'src/dtos/audit.dto';
import { AssetFileType, AssetPathType, DatabaseAction, EntityType, PersonPathType, UserPathType } from 'src/enum';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { IAuditRepository } from 'src/interfaces/audit.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { JobStatus } from 'src/interfaces/job.interface';
import { IPersonRepository } from 'src/interfaces/person.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { AuditService } from 'src/services/audit.service';
import { auditStub } from 'test/fixtures/audit.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { newTestService } from 'test/utils';
import { Mocked } from 'vitest';

describe(AuditService.name, () => {
  let sut: AuditService;
  let auditMock: Mocked<IAuditRepository>;
  let assetMock: Mocked<IAssetRepository>;
  let cryptoMock: Mocked<ICryptoRepository>;
  let personMock: Mocked<IPersonRepository>;
  let userMock: Mocked<IUserRepository>;

  beforeEach(() => {
    ({ sut, auditMock, assetMock, cryptoMock, personMock, userMock } = newTestService(AuditService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('handleCleanup', () => {
    it('should delete old audit entries', async () => {
      await expect(sut.handleCleanup()).resolves.toBe(JobStatus.SUCCESS);
      expect(auditMock.removeBefore).toHaveBeenCalledWith(expect.any(Date));
    });
  });

  describe('getDeletes', () => {
    it('should require full sync if the request is older than 100 days', async () => {
      auditMock.getAfter.mockResolvedValue([]);

      const date = new Date(2022, 0, 1);
      await expect(sut.getDeletes(authStub.admin, { after: date, entityType: EntityType.ASSET })).resolves.toEqual({
        needsFullSync: true,
        ids: [],
      });

      expect(auditMock.getAfter).toHaveBeenCalledWith(date, {
        action: DatabaseAction.DELETE,
        userIds: [authStub.admin.user.id],
        entityType: EntityType.ASSET,
      });
    });

    it('should get any new or updated assets and deleted ids', async () => {
      auditMock.getAfter.mockResolvedValue([auditStub.delete.entityId]);

      const date = new Date();
      await expect(sut.getDeletes(authStub.admin, { after: date, entityType: EntityType.ASSET })).resolves.toEqual({
        needsFullSync: false,
        ids: ['asset-deleted'],
      });

      expect(auditMock.getAfter).toHaveBeenCalledWith(date, {
        action: DatabaseAction.DELETE,
        userIds: [authStub.admin.user.id],
        entityType: EntityType.ASSET,
      });
    });
  });

  describe('getChecksums', () => {
    it('should fail if the file is not in the immich path', async () => {
      await expect(sut.getChecksums({ filenames: ['foo/bar'] })).rejects.toBeInstanceOf(BadRequestException);

      expect(cryptoMock.hashFile).not.toHaveBeenCalled();
    });

    it('should get checksum for valid file', async () => {
      await expect(sut.getChecksums({ filenames: ['./upload/my-file.jpg'] })).resolves.toEqual([
        { filename: './upload/my-file.jpg', checksum: expect.any(String) },
      ]);

      expect(cryptoMock.hashFile).toHaveBeenCalledWith('./upload/my-file.jpg');
    });
  });

  describe('fixItems', () => {
    it('should fail if the file is not in the immich path', async () => {
      await expect(
        sut.fixItems([
          { entityId: 'my-id', pathType: AssetPathType.ORIGINAL, pathValue: 'foo/bar' } as FileReportItemDto,
        ]),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(assetMock.update).not.toHaveBeenCalled();
      expect(assetMock.upsertFile).not.toHaveBeenCalled();
      expect(personMock.update).not.toHaveBeenCalled();
      expect(userMock.update).not.toHaveBeenCalled();
    });

    it('should update encoded video path', async () => {
      await sut.fixItems([
        {
          entityId: 'my-id',
          pathType: AssetPathType.ENCODED_VIDEO,
          pathValue: './upload/my-video.mp4',
        } as FileReportItemDto,
      ]);

      expect(assetMock.update).toHaveBeenCalledWith({ id: 'my-id', encodedVideoPath: './upload/my-video.mp4' });
      expect(assetMock.upsertFile).not.toHaveBeenCalled();
      expect(personMock.update).not.toHaveBeenCalled();
      expect(userMock.update).not.toHaveBeenCalled();
    });

    it('should update preview path', async () => {
      await sut.fixItems([
        {
          entityId: 'my-id',
          pathType: AssetPathType.PREVIEW,
          pathValue: './upload/my-preview.png',
        } as FileReportItemDto,
      ]);

      expect(assetMock.upsertFile).toHaveBeenCalledWith({
        assetId: 'my-id',
        type: AssetFileType.PREVIEW,
        path: './upload/my-preview.png',
      });
      expect(assetMock.update).not.toHaveBeenCalled();
      expect(personMock.update).not.toHaveBeenCalled();
      expect(userMock.update).not.toHaveBeenCalled();
    });

    it('should update thumbnail path', async () => {
      await sut.fixItems([
        {
          entityId: 'my-id',
          pathType: AssetPathType.THUMBNAIL,
          pathValue: './upload/my-thumbnail.webp',
        } as FileReportItemDto,
      ]);

      expect(assetMock.upsertFile).toHaveBeenCalledWith({
        assetId: 'my-id',
        type: AssetFileType.THUMBNAIL,
        path: './upload/my-thumbnail.webp',
      });
      expect(assetMock.update).not.toHaveBeenCalled();
      expect(personMock.update).not.toHaveBeenCalled();
      expect(userMock.update).not.toHaveBeenCalled();
    });

    it('should update original path', async () => {
      await sut.fixItems([
        {
          entityId: 'my-id',
          pathType: AssetPathType.ORIGINAL,
          pathValue: './upload/my-original.png',
        } as FileReportItemDto,
      ]);

      expect(assetMock.update).toHaveBeenCalledWith({ id: 'my-id', originalPath: './upload/my-original.png' });
      expect(assetMock.upsertFile).not.toHaveBeenCalled();
      expect(personMock.update).not.toHaveBeenCalled();
      expect(userMock.update).not.toHaveBeenCalled();
    });

    it('should update sidecar path', async () => {
      await sut.fixItems([
        {
          entityId: 'my-id',
          pathType: AssetPathType.SIDECAR,
          pathValue: './upload/my-sidecar.xmp',
        } as FileReportItemDto,
      ]);

      expect(assetMock.update).toHaveBeenCalledWith({ id: 'my-id', sidecarPath: './upload/my-sidecar.xmp' });
      expect(assetMock.upsertFile).not.toHaveBeenCalled();
      expect(personMock.update).not.toHaveBeenCalled();
      expect(userMock.update).not.toHaveBeenCalled();
    });

    it('should update face path', async () => {
      await sut.fixItems([
        {
          entityId: 'my-id',
          pathType: PersonPathType.FACE,
          pathValue: './upload/my-face.jpg',
        } as FileReportItemDto,
      ]);

      expect(personMock.update).toHaveBeenCalledWith({ id: 'my-id', thumbnailPath: './upload/my-face.jpg' });
      expect(assetMock.update).not.toHaveBeenCalled();
      expect(assetMock.upsertFile).not.toHaveBeenCalled();
      expect(userMock.update).not.toHaveBeenCalled();
    });

    it('should update profile path', async () => {
      await sut.fixItems([
        {
          entityId: 'my-id',
          pathType: UserPathType.PROFILE,
          pathValue: './upload/my-profile-pic.jpg',
        } as FileReportItemDto,
      ]);

      expect(userMock.update).toHaveBeenCalledWith('my-id', { profileImagePath: './upload/my-profile-pic.jpg' });
      expect(assetMock.update).not.toHaveBeenCalled();
      expect(assetMock.upsertFile).not.toHaveBeenCalled();
      expect(personMock.update).not.toHaveBeenCalled();
    });
  });
});
