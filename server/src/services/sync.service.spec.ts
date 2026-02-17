import { mapAsset } from 'src/dtos/asset-response.dto';
import { SyncService } from 'src/services/sync.service';
import { AssetFactory } from 'test/factories/asset.factory';
import { authStub } from 'test/fixtures/auth.stub';
import { factory } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

const untilDate = new Date(2024);
const mapAssetOpts = { auth: authStub.user1, stripMetadata: false, withStack: true };

describe(SyncService.name, () => {
  let sut: SyncService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(SyncService));
  });

  it('should exist', () => {
    expect(sut).toBeDefined();
  });

  describe('getAllAssetsForUserFullSync', () => {
    it('should return a list of all assets owned by the user', async () => {
      const [asset1, asset2] = [
        AssetFactory.from({ libraryId: 'library-id', isExternal: true }).owner(authStub.user1.user).build(),
        AssetFactory.from().owner(authStub.user1.user).build(),
      ];
      mocks.asset.getAllForUserFullSync.mockResolvedValue([asset1, asset2]);
      await expect(sut.getFullSync(authStub.user1, { limit: 2, updatedUntil: untilDate })).resolves.toEqual([
        mapAsset(asset1, mapAssetOpts),
        mapAsset(asset2, mapAssetOpts),
      ]);
      expect(mocks.asset.getAllForUserFullSync).toHaveBeenCalledWith({
        ownerId: authStub.user1.user.id,
        updatedUntil: untilDate,
        limit: 2,
      });
    });
  });

  describe('getChangesForDeltaSync', () => {
    it('should return a response requiring a full sync when partners are out of sync', async () => {
      const partner = factory.partner();
      const auth = factory.auth({ user: { id: partner.sharedWithId } });

      mocks.partner.getAll.mockResolvedValue([partner]);

      await expect(
        sut.getDeltaSync(authStub.user1, { updatedAfter: new Date(), userIds: [auth.user.id] }),
      ).resolves.toEqual({ needsFullSync: true, upserted: [], deleted: [] });

      expect(mocks.asset.getChangedDeltaSync).toHaveBeenCalledTimes(0);
      expect(mocks.audit.getAfter).toHaveBeenCalledTimes(0);
    });

    it('should return a response requiring a full sync when last sync was too long ago', async () => {
      mocks.partner.getAll.mockResolvedValue([]);
      await expect(
        sut.getDeltaSync(authStub.user1, { updatedAfter: new Date(2000), userIds: [authStub.user1.user.id] }),
      ).resolves.toEqual({ needsFullSync: true, upserted: [], deleted: [] });
      expect(mocks.asset.getChangedDeltaSync).toHaveBeenCalledTimes(0);
      expect(mocks.audit.getAfter).toHaveBeenCalledTimes(0);
    });

    it('should return a response requiring a full sync when there are too many changes', async () => {
      const asset = AssetFactory.create();
      mocks.partner.getAll.mockResolvedValue([]);
      mocks.asset.getChangedDeltaSync.mockResolvedValue(Array.from<typeof asset>({ length: 10_000 }).fill(asset));
      await expect(
        sut.getDeltaSync(authStub.user1, { updatedAfter: new Date(), userIds: [authStub.user1.user.id] }),
      ).resolves.toEqual({ needsFullSync: true, upserted: [], deleted: [] });
      expect(mocks.asset.getChangedDeltaSync).toHaveBeenCalledTimes(1);
      expect(mocks.audit.getAfter).toHaveBeenCalledTimes(0);
    });

    it('should return a response with changes and deletions', async () => {
      const asset = AssetFactory.create({ ownerId: authStub.user1.user.id });
      const deletedAsset = AssetFactory.create({ libraryId: 'library-id', isExternal: true });
      mocks.partner.getAll.mockResolvedValue([]);
      mocks.asset.getChangedDeltaSync.mockResolvedValue([asset]);
      mocks.audit.getAfter.mockResolvedValue([deletedAsset.id]);
      await expect(
        sut.getDeltaSync(authStub.user1, { updatedAfter: new Date(), userIds: [authStub.user1.user.id] }),
      ).resolves.toEqual({
        needsFullSync: false,
        upserted: [mapAsset(asset, mapAssetOpts)],
        deleted: [deletedAsset.id],
      });
      expect(mocks.asset.getChangedDeltaSync).toHaveBeenCalledTimes(1);
      expect(mocks.audit.getAfter).toHaveBeenCalledTimes(1);
    });
  });
});
