import { Readable, Writable } from 'node:stream';
import { StorageCore } from 'src/cores/storage.core';
import { AssetVisibility, JobStatus, SyncNodeStatus } from 'src/enum';
import { SyncEngineService } from 'src/services/sync-engine.service';
import { newTestService, ServiceMocks } from 'test/utils';

const nodeStub = {
  id: 'node-1',
  name: 'Peer',
  url: 'https://peer.example',
  apiKey: 'peer-key',
  isEnabled: true,
  status: SyncNodeStatus.Online,
  remoteVersion: '3.1.0',
  lastCheckedAt: new Date('2026-01-01'),
  error: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  updateId: 'update-1',
};

const pairingStub = {
  id: 'pairing-1',
  nodeId: 'node-1',
  localUserId: 'user-1',
  remoteUserId: 'remote-user-1',
  remoteUserEmail: 'alice@peer.example',
  apiKey: 'paired-user-key',
  pushEnabled: true,
  pullEnabled: true,
  pushCursor: null,
  pullCursor: null,
  lastSyncedAt: null,
  error: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  updateId: 'update-1',
};

const assetStub = {
  id: 'asset-1',
  ownerId: 'user-1',
  originalPath: '/data/library/user-1/IMG_0001.jpg',
  originalFileName: 'IMG_0001.jpg',
  checksum: Buffer.from('checksum'),
  type: 'IMAGE',
  isFavorite: false,
  visibility: AssetVisibility.Timeline,
  fileCreatedAt: new Date('2026-01-01'),
  fileModifiedAt: new Date('2026-01-01'),
  deletedAt: null,
  updateId: 'asset-update-1',
  isExternal: false,
  isOffline: false,
  description: null,
};

const mappingStub = {
  id: 'mapping-1',
  nodeUserId: 'pairing-1',
  localAssetId: 'asset-1',
  remoteAssetId: 'remote-asset-1',
  checksum: Buffer.from('checksum'),
  origin: 'push',
  metadataUpdateId: 'asset-update-1',
  trashSyncedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const setupDownload = (mocks: ServiceMocks) => {
  mocks.storage.mkdirSync.mockReturnValue(void 0);
  mocks.nodeClient.getRemoteAsset.mockResolvedValue({
    id: 'remote-1',
    originalFileName: 'IMG_9000.jpg',
    fileCreatedAt: '2026-01-01T00:00:00.000Z',
    fileModifiedAt: '2026-01-01T00:00:00.000Z',
    isFavorite: true,
    isArchived: false,
    checksum: 'abc',
    type: 'IMAGE',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });
  mocks.nodeClient.downloadAsset.mockResolvedValue(Readable.from(['bytes']));
  mocks.storage.createWriteStream.mockImplementation(
    () =>
      new Writable({
        write(_chunk, _encoding, callback) {
          callback();
        },
      }),
  );
  mocks.crypto.hashFile.mockResolvedValue(Buffer.from('checksum'));
  mocks.storage.stat.mockResolvedValue({ size: 5 } as never);
};

describe(SyncEngineService.name, () => {
  let sut: SyncEngineService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(SyncEngineService));

    StorageCore.setMediaLocation('/data');

    mocks.syncNode.getPairing.mockResolvedValue(pairingStub);
    mocks.syncNode.get.mockResolvedValue(nodeStub);
    mocks.syncNode.updatePairing.mockResolvedValue(pairingStub);
    mocks.syncNode.getChangedAssets.mockResolvedValue([]);
    mocks.syncNode.getMappedRemoteIds.mockResolvedValue(new Set());
    mocks.nodeClient.searchAssets.mockResolvedValue({ items: [], nextPage: null });
    mocks.nodeClient.updateAsset.mockResolvedValue(void 0);
    mocks.nodeClient.trashAssets.mockResolvedValue(void 0);
    mocks.nodeClient.getAlbums.mockResolvedValue([]);
    mocks.syncNode.getAlbumsForOwner.mockResolvedValue([]);
    mocks.syncNode.getAlbumMappings.mockResolvedValue([]);
    mocks.storage.checkFileExists.mockResolvedValue(false);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('handleQueueAll', () => {
    it('should queue one job per syncable pairing', async () => {
      mocks.syncNode.getSyncablePairings.mockResolvedValue([{ id: 'a' }, { id: 'b' }] as never);

      await expect(sut.handleQueueAll()).resolves.toBe(JobStatus.Success);

      expect(mocks.job.queue).toHaveBeenCalledTimes(2);
    });
  });

  describe('handlePair', () => {
    it('should skip a pairing that no longer exists', async () => {
      mocks.syncNode.getPairing.mockResolvedValue(void 0);

      await expect(sut.handlePair({ pairingId: 'gone' })).resolves.toBe(JobStatus.Skipped);
    });

    it('should skip a node that has been disabled', async () => {
      mocks.syncNode.get.mockResolvedValue({ ...nodeStub, isEnabled: false });

      await expect(sut.handlePair({ pairingId: 'pairing-1' })).resolves.toBe(JobStatus.Skipped);
    });

    it('should record the error on the pairing when a run fails', async () => {
      mocks.syncNode.getChangedAssets.mockRejectedValue(new Error('peer exploded'));

      await expect(sut.handlePair({ pairingId: 'pairing-1' })).resolves.toBe(JobStatus.Failed);

      expect(mocks.syncNode.updatePairing).toHaveBeenCalledWith(
        'pairing-1',
        expect.objectContaining({ error: 'peer exploded' }),
      );
    });

    it('should not push when push is disabled for the pairing', async () => {
      mocks.syncNode.getPairing.mockResolvedValue({ ...pairingStub, pushEnabled: false, pullEnabled: false });

      await expect(sut.handlePair({ pairingId: 'pairing-1' })).resolves.toBe(JobStatus.Success);

      expect(mocks.syncNode.getChangedAssets).not.toHaveBeenCalled();
      expect(mocks.nodeClient.searchAssets).not.toHaveBeenCalled();
    });

    it('should advance the push cursor to the last asset seen', async () => {
      mocks.syncNode.getPairing.mockResolvedValue({ ...pairingStub, pullEnabled: false });
      mocks.syncNode.getChangedAssets.mockResolvedValueOnce([
        { ...assetStub, id: 'a', updateId: 'u1' },
        { ...assetStub, id: 'b', updateId: 'u2' },
      ] as never);
      mocks.syncNode.getAssetMapping.mockResolvedValue(mappingStub);

      await sut.handlePair({ pairingId: 'pairing-1' });

      expect(mocks.syncNode.updatePairing).toHaveBeenCalledWith('pairing-1', { pushCursor: 'u2' });
    });

    it("should adopt the peer's copy when it already holds identical bytes", async () => {
      mocks.syncNode.getPairing.mockResolvedValue({ ...pairingStub, pullEnabled: false });
      mocks.syncNode.getChangedAssets.mockResolvedValueOnce([assetStub] as never);
      mocks.syncNode.getAssetMapping.mockResolvedValue(void 0);
      mocks.nodeClient.bulkUploadCheck.mockResolvedValue({
        'asset-1': { action: 'reject', assetId: 'remote-existing' },
      });

      await sut.handlePair({ pairingId: 'pairing-1' });

      expect(mocks.nodeClient.uploadAsset).not.toHaveBeenCalled();
      expect(mocks.syncNode.upsertAssetMapping).toHaveBeenCalledWith(
        expect.objectContaining({ remoteAssetId: 'remote-existing', origin: 'push-dedupe' }),
      );
    });

    it('should propagate a local trash to the peer exactly once', async () => {
      mocks.syncNode.getPairing.mockResolvedValue({ ...pairingStub, pullEnabled: false });
      mocks.syncNode.getChangedAssets.mockResolvedValueOnce([
        { ...assetStub, deletedAt: new Date('2026-02-01') },
      ] as never);
      mocks.syncNode.getAssetMapping.mockResolvedValue(mappingStub);
      mocks.syncNode.updateAssetMapping.mockResolvedValue(mappingStub);

      await sut.handlePair({ pairingId: 'pairing-1' });

      expect(mocks.nodeClient.trashAssets).toHaveBeenCalledWith(expect.anything(), ['remote-asset-1']);
      expect(mocks.syncNode.updateAssetMapping).toHaveBeenCalledWith(
        'mapping-1',
        expect.objectContaining({ trashSyncedAt: expect.any(Date) }),
      );
    });

    it('should not re-trash an asset whose deletion already travelled', async () => {
      mocks.syncNode.getPairing.mockResolvedValue({ ...pairingStub, pullEnabled: false });
      mocks.syncNode.getChangedAssets.mockResolvedValueOnce([
        { ...assetStub, deletedAt: new Date('2026-02-01') },
      ] as never);
      mocks.syncNode.getAssetMapping.mockResolvedValue({ ...mappingStub, trashSyncedAt: new Date('2026-02-02') });

      await sut.handlePair({ pairingId: 'pairing-1' });

      expect(mocks.nodeClient.trashAssets).not.toHaveBeenCalled();
    });

    it('should never send an external or offline asset, having no local bytes', async () => {
      mocks.syncNode.getPairing.mockResolvedValue({ ...pairingStub, pullEnabled: false });
      mocks.syncNode.getChangedAssets.mockResolvedValueOnce([
        { ...assetStub, id: 'ext', isExternal: true },
        { ...assetStub, id: 'off', isOffline: true },
      ] as never);

      await sut.handlePair({ pairingId: 'pairing-1' });

      expect(mocks.nodeClient.uploadAsset).not.toHaveBeenCalled();
      expect(mocks.syncNode.getAssetMapping).not.toHaveBeenCalled();
    });

    it('should only queue remote assets it has never seen', async () => {
      mocks.syncNode.getPairing.mockResolvedValue({ ...pairingStub, pushEnabled: false });
      mocks.nodeClient.searchAssets.mockResolvedValue({
        items: [{ id: 'remote-a' }, { id: 'remote-b' }],
        nextPage: null,
      } as never);
      // remote-a is already mapped, so only remote-b is new.
      mocks.syncNode.getMappedRemoteIds.mockResolvedValue(new Set(['remote-a']));

      await sut.handlePair({ pairingId: 'pairing-1' });

      const pullJobs = mocks.job.queue.mock.calls.filter(([job]: any[]) => job.name === 'NodeSyncPullAsset');
      expect(pullJobs).toHaveLength(1);
      expect(pullJobs[0][0].data).toEqual({ pairingId: 'pairing-1', assetId: 'remote-b' });
    });
  });

  describe('handlePullAsset', () => {
    it('should skip a remote asset that is already mapped', async () => {
      mocks.syncNode.getMappingByRemoteId.mockResolvedValue(mappingStub);

      await expect(sut.handlePullAsset({ pairingId: 'pairing-1', assetId: 'remote-1' })).resolves.toBe(
        JobStatus.Skipped,
      );

      expect(mocks.nodeClient.downloadAsset).not.toHaveBeenCalled();
    });

    it('should map rather than duplicate when the bytes are already here', async () => {
      mocks.syncNode.getMappingByRemoteId.mockResolvedValue(void 0);
      setupDownload(mocks);
      mocks.asset.getUploadAssetIdByChecksum.mockResolvedValue('local-existing');

      await expect(sut.handlePullAsset({ pairingId: 'pairing-1', assetId: 'remote-1' })).resolves.toBe(
        JobStatus.Skipped,
      );

      expect(mocks.asset.create).not.toHaveBeenCalled();
      expect(mocks.syncNode.upsertAssetMapping).toHaveBeenCalledWith(
        expect.objectContaining({ localAssetId: 'local-existing', origin: 'pull-dedupe' }),
      );
    });

    it('should create the asset and queue metadata extraction', async () => {
      mocks.syncNode.getMappingByRemoteId.mockResolvedValue(void 0);
      setupDownload(mocks);
      mocks.asset.getUploadAssetIdByChecksum.mockResolvedValue(void 0);
      mocks.asset.create.mockResolvedValue({ id: 'local-new' } as never);
      mocks.asset.upsertExif.mockResolvedValue(void 0);

      await expect(sut.handlePullAsset({ pairingId: 'pairing-1', assetId: 'remote-1' })).resolves.toBe(
        JobStatus.Success,
      );

      expect(mocks.asset.create).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: 'user-1', originalFileName: 'IMG_9000.jpg', isFavorite: true }),
      );
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: 'AssetExtractMetadata',
        data: { id: 'local-new', source: 'upload' },
      });
    });

    it('should clean up the partial download when the pull fails', async () => {
      mocks.syncNode.getMappingByRemoteId.mockResolvedValue(void 0);
      setupDownload(mocks);
      mocks.asset.getUploadAssetIdByChecksum.mockResolvedValue(void 0);
      mocks.asset.create.mockRejectedValue(new Error('constraint'));

      await expect(sut.handlePullAsset({ pairingId: 'pairing-1', assetId: 'remote-1' })).resolves.toBe(
        JobStatus.Failed,
      );

      expect(mocks.job.queue).toHaveBeenCalledWith(expect.objectContaining({ name: 'FileDelete' }));
    });
  });
});
