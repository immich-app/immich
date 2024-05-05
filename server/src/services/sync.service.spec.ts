import { mapAsset } from 'src/dtos/asset-response.dto';
import { AssetEntity } from 'src/entities/asset.entity';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { IAuditRepository } from 'src/interfaces/audit.interface';
import { IPartnerRepository } from 'src/interfaces/partner.interface';
import { SyncService } from 'src/services/sync.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { partnerStub } from 'test/fixtures/partner.stub';
import { newAccessRepositoryMock } from 'test/repositories/access.repository.mock';
import { newAssetRepositoryMock } from 'test/repositories/asset.repository.mock';
import { newAuditRepositoryMock } from 'test/repositories/audit.repository.mock';
import { newPartnerRepositoryMock } from 'test/repositories/partner.repository.mock';
import { Mocked } from 'vitest';

const untilDate = new Date(2024);
const mapAssetOpts = { auth: authStub.user1, stripMetadata: false, withStack: true };

describe(SyncService.name, () => {
  let sut: SyncService;
  let accessMock: Mocked<IAccessRepository>;
  let assetMock: Mocked<IAssetRepository>;
  let partnerMock: Mocked<IPartnerRepository>;
  let auditMock: Mocked<IAuditRepository>;

  beforeEach(() => {
    partnerMock = newPartnerRepositoryMock();
    assetMock = newAssetRepositoryMock();
    accessMock = newAccessRepositoryMock();
    auditMock = newAuditRepositoryMock();
    sut = new SyncService(accessMock, assetMock, partnerMock, auditMock);
  });

  it('should exist', () => {
    expect(sut).toBeDefined();
  });

  describe('getAllAssetsForUserFullSync', () => {
    it('should return a list of all assets owned by the user', async () => {
      assetMock.getAllForUserFullSync.mockResolvedValue([assetStub.external, assetStub.hasEncodedVideo]);
      await expect(sut.getFullSync(authStub.user1, { limit: 2, updatedUntil: untilDate })).resolves.toEqual([
        mapAsset(assetStub.external, mapAssetOpts),
        mapAsset(assetStub.hasEncodedVideo, mapAssetOpts),
      ]);
      expect(assetMock.getAllForUserFullSync).toHaveBeenCalledWith({
        withStacked: true,
        ownerId: authStub.user1.user.id,
        updatedUntil: untilDate,
        limit: 2,
      });
    });
  });

  describe('getChangesForDeltaSync', () => {
    it('should return a response requiring a full sync when partners are out of sync', async () => {
      partnerMock.getAll.mockResolvedValue([partnerStub.adminToUser1]);
      await expect(
        sut.getDeltaSync(authStub.user1, { updatedAfter: new Date(), userIds: [authStub.user1.user.id] }),
      ).resolves.toEqual({ needsFullSync: true, upserted: [], deleted: [] });
      expect(assetMock.getChangedDeltaSync).toHaveBeenCalledTimes(0);
      expect(auditMock.getAfter).toHaveBeenCalledTimes(0);
    });

    it('should return a response requiring a full sync when last sync was too long ago', async () => {
      partnerMock.getAll.mockResolvedValue([]);
      await expect(
        sut.getDeltaSync(authStub.user1, { updatedAfter: new Date(2000), userIds: [authStub.user1.user.id] }),
      ).resolves.toEqual({ needsFullSync: true, upserted: [], deleted: [] });
      expect(assetMock.getChangedDeltaSync).toHaveBeenCalledTimes(0);
      expect(auditMock.getAfter).toHaveBeenCalledTimes(0);
    });

    it('should return a response requiring a full sync when there are too many changes', async () => {
      partnerMock.getAll.mockResolvedValue([]);
      assetMock.getChangedDeltaSync.mockResolvedValue(
        Array.from<AssetEntity>({ length: 10_000 }).fill(assetStub.image),
      );
      await expect(
        sut.getDeltaSync(authStub.user1, { updatedAfter: new Date(), userIds: [authStub.user1.user.id] }),
      ).resolves.toEqual({ needsFullSync: true, upserted: [], deleted: [] });
      expect(assetMock.getChangedDeltaSync).toHaveBeenCalledTimes(1);
      expect(auditMock.getAfter).toHaveBeenCalledTimes(0);
    });

    it('should return a response with changes and deletions', async () => {
      partnerMock.getAll.mockResolvedValue([]);
      assetMock.getChangedDeltaSync.mockResolvedValue([assetStub.image1]);
      auditMock.getAfter.mockResolvedValue([assetStub.external.id]);
      await expect(
        sut.getDeltaSync(authStub.user1, { updatedAfter: new Date(), userIds: [authStub.user1.user.id] }),
      ).resolves.toEqual({
        needsFullSync: false,
        upserted: [mapAsset(assetStub.image1, mapAssetOpts)],
        deleted: [assetStub.external.id],
      });
      expect(assetMock.getChangedDeltaSync).toHaveBeenCalledTimes(1);
      expect(auditMock.getAfter).toHaveBeenCalledTimes(1);
    });
  });
});
