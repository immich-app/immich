import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Writable } from 'node:stream';
import { mapAsset } from 'src/dtos/asset-response.dto';
import { AssetVisibility, SyncEntityType, SyncRequestType } from 'src/enum';
import { SyncService } from 'src/services/sync.service';
import { toAck } from 'src/utils/sync';
import { AssetFactory } from 'test/factories/asset.factory';
import { authStub } from 'test/fixtures/auth.stub';
import { factory, newUuid } from 'test/small.factory';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';

const untilDate = new Date(2024);
const mapAssetOpts = { auth: authStub.user1, stripMetadata: false, withStack: true };

const makeWritable = () => {
  const chunks: string[] = [];
  const writable = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(chunk.toString());
      callback();
    },
  });
  return { writable, chunks };
};

const parseChunks = (chunks: string[]) => {
  return chunks.flatMap((chunk) =>
    chunk
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line)),
  );
};

/**
 * Create mock sub-repos for SyncRepository. The automock doesn't handle
 * nested instance properties created in the constructor, so we wire them up manually.
 */
const setupSyncMocks = (mocks: ServiceMocks) => {
  const makeSub = () => ({
    getDeletes: vi.fn().mockReturnValue(makeStream([])),
    getUpserts: vi.fn().mockReturnValue(makeStream([])),
    getBackfill: vi.fn().mockReturnValue(makeStream([])),
    getCreatedAfter: vi.fn().mockResolvedValue([]),
    cleanupAuditTable: vi.fn().mockResolvedValue(undefined),
    getCreates: vi.fn().mockReturnValue(makeStream([])),
    getUpdates: vi.fn().mockReturnValue(makeStream([])),
  });

  const subs = {
    album: makeSub(),
    albumAsset: makeSub(),
    albumAssetExif: makeSub(),
    albumToAsset: makeSub(),
    albumUser: makeSub(),
    asset: makeSub(),
    assetExif: makeSub(),
    assetEdit: makeSub(),
    assetFace: makeSub(),
    assetMetadata: makeSub(),
    authUser: makeSub(),
    memory: makeSub(),
    memoryToAsset: makeSub(),
    partner: makeSub(),
    partnerAsset: makeSub(),
    partnerAssetExif: makeSub(),
    partnerStack: makeSub(),
    person: makeSub(),
    stack: makeSub(),
    user: makeSub(),
    userMetadata: makeSub(),
  };

  // Assign onto the mock
  Object.assign(mocks.sync, subs);

  return subs;
};

describe(SyncService.name, () => {
  let sut: SyncService;
  let mocks: ServiceMocks;
  let syncSubs: ReturnType<typeof setupSyncMocks>;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(SyncService));
    syncSubs = setupSyncMocks(mocks);
    // These strict mocks need implementations since they're called in test paths
    mocks.syncCheckpoint.upsertAll.mockResolvedValue(undefined as any);
    mocks.syncCheckpoint.deleteAll.mockResolvedValue(undefined as any);
    mocks.session.resetSyncProgress.mockResolvedValue(undefined as any);
  });

  it('should exist', () => {
    expect(sut).toBeDefined();
  });

  describe('getAcks', () => {
    it('should throw ForbiddenException when no session (API key)', () => {
      expect(() => sut.getAcks(authStub.admin)).toThrow(ForbiddenException);
    });

    it('should return all checkpoints for the session', async () => {
      const sessionId = authStub.user1.session!.id;
      const checkpoints = [{ type: SyncEntityType.AssetV1, ack: 'AssetV1|some-id' }];
      mocks.syncCheckpoint.getAll.mockResolvedValue(checkpoints);

      const result = await sut.getAcks(authStub.user1);

      expect(result).toEqual(checkpoints);
      expect(mocks.syncCheckpoint.getAll).toHaveBeenCalledWith(sessionId);
    });
  });

  describe('setAcks', () => {
    it('should throw ForbiddenException when no session (API key)', async () => {
      await expect(sut.setAcks(authStub.admin, { acks: [] })).rejects.toThrow(ForbiddenException);
    });

    it('should reset sync progress when ack type is SyncResetV1', async () => {
      const sessionId = authStub.user1.session!.id;
      const ack = toAck({ type: SyncEntityType.SyncResetV1, updateId: 'reset' });

      await sut.setAcks(authStub.user1, { acks: [ack] });

      expect(mocks.session.resetSyncProgress).toHaveBeenCalledWith(sessionId);
      expect(mocks.syncCheckpoint.upsertAll).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid ack type', async () => {
      const ack = 'InvalidType|some-id';

      await expect(sut.setAcks(authStub.user1, { acks: [ack] })).rejects.toThrow(BadRequestException);
    });

    it('should upsert checkpoints for valid acks', async () => {
      const sessionId = authStub.user1.session!.id;
      const ack = toAck({ type: SyncEntityType.AssetV1, updateId: 'some-update-id' });

      await sut.setAcks(authStub.user1, { acks: [ack] });

      expect(mocks.syncCheckpoint.upsertAll).toHaveBeenCalledWith([
        { sessionId, type: SyncEntityType.AssetV1, ack },
      ]);
    });

    it('should handle multiple acks of different types', async () => {
      const sessionId = authStub.user1.session!.id;
      const ack1 = toAck({ type: SyncEntityType.AssetV1, updateId: 'id-1' });
      const ack2 = toAck({ type: SyncEntityType.UserV1, updateId: 'id-2' });

      await sut.setAcks(authStub.user1, { acks: [ack1, ack2] });

      expect(mocks.syncCheckpoint.upsertAll).toHaveBeenCalledWith([
        { sessionId, type: SyncEntityType.AssetV1, ack: ack1 },
        { sessionId, type: SyncEntityType.UserV1, ack: ack2 },
      ]);
    });
  });

  describe('deleteAcks', () => {
    it('should throw ForbiddenException when no session (API key)', async () => {
      await expect(sut.deleteAcks(authStub.admin, { types: [] })).rejects.toThrow(ForbiddenException);
    });

    it('should delete checkpoints for the session', async () => {
      const sessionId = authStub.user1.session!.id;
      const types = [SyncEntityType.AssetV1, SyncEntityType.UserV1];

      await sut.deleteAcks(authStub.user1, { types });

      expect(mocks.syncCheckpoint.deleteAll).toHaveBeenCalledWith(sessionId, types);
    });
  });

  describe('stream', () => {
    it('should throw ForbiddenException when no session (API key)', async () => {
      const { writable } = makeWritable();

      await expect(sut.stream(authStub.admin, writable, { types: [] })).rejects.toThrow(ForbiddenException);
    });

    it('should reset sync progress and then stream when reset is true', async () => {
      const { writable, chunks } = makeWritable();
      const sessionId = authStub.user1.session!.id;

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });

      await sut.stream(authStub.user1, writable, { types: [], reset: true });

      expect(mocks.session.resetSyncProgress).toHaveBeenCalledWith(sessionId);
      const messages = parseChunks(chunks);
      expect(messages).toEqual([expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 })]);
    });

    it('should send SyncResetV1 and end when isPendingSyncReset is true', async () => {
      const { writable, chunks } = makeWritable();

      mocks.session.isPendingSyncReset.mockResolvedValue(true);

      await sut.stream(authStub.user1, writable, { types: [] });

      const messages = parseChunks(chunks);
      expect(messages).toEqual([expect.objectContaining({ type: SyncEntityType.SyncResetV1 })]);
    });

    it('should send SyncResetV1 when SyncCompleteV1 checkpoint is too old (>30 days)', async () => {
      const { writable, chunks } = makeWritable();

      // Create a UUID v7 that encodes a timestamp from 60 days ago
      const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
      const hex = sixtyDaysAgo.toString(16).padStart(12, '0');
      const oldUuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-7000-8000-000000000000`;

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([
        {
          type: SyncEntityType.SyncCompleteV1,
          ack: toAck({ type: SyncEntityType.SyncCompleteV1, updateId: oldUuid }),
        },
      ]);

      await sut.stream(authStub.user1, writable, { types: [] });

      const messages = parseChunks(chunks);
      expect(messages).toEqual([expect.objectContaining({ type: SyncEntityType.SyncResetV1 })]);
    });

    it('should not require full sync when SyncCompleteV1 is recent', async () => {
      const { writable, chunks } = makeWritable();

      const recentTimestamp = Date.now() - 5 * 24 * 60 * 60 * 1000; // 5 days ago
      const hex = recentTimestamp.toString(16).padStart(12, '0');
      const recentUuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-7000-8000-000000000000`;

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([
        {
          type: SyncEntityType.SyncCompleteV1,
          ack: toAck({ type: SyncEntityType.SyncCompleteV1, updateId: recentUuid }),
        },
      ]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });

      await sut.stream(authStub.user1, writable, { types: [] });

      const messages = parseChunks(chunks);
      expect(messages).toEqual([expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 })]);
    });

    it('should send SyncCompleteV1 at the end of stream', async () => {
      const { writable, chunks } = makeWritable();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });

      await sut.stream(authStub.user1, writable, { types: [] });

      const messages = parseChunks(chunks);
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual(expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }));
    });

    it('should handle UsersV1 sync type with deletes and upserts', async () => {
      const { writable, chunks } = makeWritable();
      const deleteId = newUuid();
      const updateId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.user.getDeletes.mockReturnValue(
        makeStream([{ id: deleteId, userId: 'user-1' }]),
      );
      syncSubs.user.getUpserts.mockReturnValue(
        makeStream([{ updateId, id: 'user-1', name: 'Test', email: 'a@b.com', profileImagePath: '' }]),
      );

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.UsersV1] });

      const messages = parseChunks(chunks);
      expect(messages.some((m: any) => m.type === SyncEntityType.UserDeleteV1)).toBe(true);
      expect(messages.some((m: any) => m.type === SyncEntityType.UserV1)).toBe(true);
      expect(messages.some((m: any) => m.type === SyncEntityType.SyncCompleteV1)).toBe(true);
    });

    it('should handle AuthUsersV1 sync type with hasProfileImage', async () => {
      const { writable, chunks } = makeWritable();
      const updateId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.authUser.getUpserts.mockReturnValue(
        makeStream([{ updateId, id: 'user-1', name: 'Test', email: 'a@b.com', profileImagePath: '/some/path' }]),
      );

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.AuthUsersV1] });

      const messages = parseChunks(chunks);
      const authUserMsg = messages.find((m: any) => m.type === SyncEntityType.AuthUserV1);
      expect(authUserMsg).toBeDefined();
      expect(authUserMsg.data.hasProfileImage).toBe(true);
    });

    it('should set hasProfileImage to false when profileImagePath is empty', async () => {
      const { writable, chunks } = makeWritable();
      const updateId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.authUser.getUpserts.mockReturnValue(
        makeStream([{ updateId, id: 'user-1', name: 'Test', email: 'a@b.com', profileImagePath: '' }]),
      );

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.AuthUsersV1] });

      const messages = parseChunks(chunks);
      const authUserMsg = messages.find((m: any) => m.type === SyncEntityType.AuthUserV1);
      expect(authUserMsg).toBeDefined();
      expect(authUserMsg.data.hasProfileImage).toBe(false);
    });

    it('should handle PartnersV1 sync type', async () => {
      const { writable, chunks } = makeWritable();
      const deleteId = newUuid();
      const updateId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.partner.getDeletes.mockReturnValue(
        makeStream([{ id: deleteId, sharedById: 'u1', sharedWithId: 'u2' }]),
      );
      syncSubs.partner.getUpserts.mockReturnValue(
        makeStream([{ updateId, sharedById: 'u1', sharedWithId: 'u2', inTimeline: true }]),
      );

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.PartnersV1] });

      const messages = parseChunks(chunks);
      expect(messages.some((m: any) => m.type === SyncEntityType.PartnerDeleteV1)).toBe(true);
      expect(messages.some((m: any) => m.type === SyncEntityType.PartnerV1)).toBe(true);
    });

    it('should handle AssetsV1 sync type with checksum/thumbhash conversion', async () => {
      const { writable, chunks } = makeWritable();
      const deleteId = newUuid();
      const updateId = newUuid();
      const checksum = Buffer.from('fakechecksum');
      const thumbhash = Buffer.from('fakethumbhash');

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.asset.getDeletes.mockReturnValue(makeStream([{ id: deleteId, assetId: 'a1' }]));
      syncSubs.asset.getUpserts.mockReturnValue(
        makeStream([
          {
            updateId,
            id: 'a1',
            ownerId: 'user-1',
            type: 'IMAGE',
            checksum,
            thumbhash,
            isFavorite: false,
            visibility: AssetVisibility.Timeline,
            deletedAt: null,
          },
        ]),
      );

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.AssetsV1] });

      const messages = parseChunks(chunks);
      const assetMsg = messages.find((m: any) => m.type === SyncEntityType.AssetV1);
      expect(assetMsg).toBeDefined();
      expect(assetMsg.data.checksum).toBe(checksum.toString('base64'));
      expect(assetMsg.data.thumbhash).toBe(thumbhash.toString('base64'));
    });

    it('should handle AssetsV1 with null thumbhash', async () => {
      const { writable, chunks } = makeWritable();
      const updateId = newUuid();
      const checksum = Buffer.from('fakechecksum');

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.asset.getDeletes.mockReturnValue(makeStream([]));
      syncSubs.asset.getUpserts.mockReturnValue(
        makeStream([
          {
            updateId,
            id: 'a1',
            ownerId: 'user-1',
            type: 'IMAGE',
            checksum,
            thumbhash: null,
            isFavorite: false,
            visibility: AssetVisibility.Timeline,
            deletedAt: null,
          },
        ]),
      );

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.AssetsV1] });

      const messages = parseChunks(chunks);
      const assetMsg = messages.find((m: any) => m.type === SyncEntityType.AssetV1);
      expect(assetMsg).toBeDefined();
      expect(assetMsg.data.thumbhash).toBeNull();
    });

    it('should handle AssetExifsV1 sync type', async () => {
      const { writable, chunks } = makeWritable();
      const updateId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.assetExif.getUpserts.mockReturnValue(
        makeStream([{ updateId, assetId: 'a1', city: 'Austin' }]),
      );

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.AssetExifsV1] });

      const messages = parseChunks(chunks);
      expect(messages.some((m: any) => m.type === SyncEntityType.AssetExifV1)).toBe(true);
    });

    it('should handle AssetEditsV1 sync type with deletes and upserts', async () => {
      const { writable, chunks } = makeWritable();
      const deleteId = newUuid();
      const updateId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.assetEdit.getDeletes.mockReturnValue(makeStream([{ id: deleteId, assetId: 'a1' }]));
      syncSubs.assetEdit.getUpserts.mockReturnValue(
        makeStream([{ updateId, assetId: 'a1', edits: [] }]),
      );

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.AssetEditsV1] });

      const messages = parseChunks(chunks);
      expect(messages.some((m: any) => m.type === SyncEntityType.AssetEditDeleteV1)).toBe(true);
      expect(messages.some((m: any) => m.type === SyncEntityType.AssetEditV1)).toBe(true);
    });

    it('should handle AlbumsV1 sync type', async () => {
      const { writable, chunks } = makeWritable();
      const deleteId = newUuid();
      const updateId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.album.getDeletes.mockReturnValue(makeStream([{ id: deleteId, albumId: 'alb-1' }]));
      syncSubs.album.getUpserts.mockReturnValue(
        makeStream([{ updateId, id: 'alb-1', albumName: 'My Album', ownerId: 'u1' }]),
      );

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.AlbumsV1] });

      const messages = parseChunks(chunks);
      expect(messages.some((m: any) => m.type === SyncEntityType.AlbumDeleteV1)).toBe(true);
      expect(messages.some((m: any) => m.type === SyncEntityType.AlbumV1)).toBe(true);
    });

    it('should handle MemoriesV1 sync type', async () => {
      const { writable, chunks } = makeWritable();
      const deleteId = newUuid();
      const updateId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.memory.getDeletes.mockReturnValue(makeStream([{ id: deleteId, memoryId: 'm1' }]));
      syncSubs.memory.getUpserts.mockReturnValue(
        makeStream([{ updateId, id: 'm1', ownerId: 'u1' }]),
      );

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.MemoriesV1] });

      const messages = parseChunks(chunks);
      expect(messages.some((m: any) => m.type === SyncEntityType.MemoryDeleteV1)).toBe(true);
      expect(messages.some((m: any) => m.type === SyncEntityType.MemoryV1)).toBe(true);
    });

    it('should handle MemoryToAssetsV1 sync type', async () => {
      const { writable, chunks } = makeWritable();
      const deleteId = newUuid();
      const updateId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.memoryToAsset.getDeletes.mockReturnValue(makeStream([{ id: deleteId, memoryId: 'm1', assetId: 'a1' }]));
      syncSubs.memoryToAsset.getUpserts.mockReturnValue(
        makeStream([{ updateId, memoryId: 'm1', assetId: 'a1' }]),
      );

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.MemoryToAssetsV1] });

      const messages = parseChunks(chunks);
      expect(messages.some((m: any) => m.type === SyncEntityType.MemoryToAssetDeleteV1)).toBe(true);
      expect(messages.some((m: any) => m.type === SyncEntityType.MemoryToAssetV1)).toBe(true);
    });

    it('should handle StacksV1 sync type', async () => {
      const { writable, chunks } = makeWritable();
      const deleteId = newUuid();
      const updateId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.stack.getDeletes.mockReturnValue(makeStream([{ id: deleteId, stackId: 's1' }]));
      syncSubs.stack.getUpserts.mockReturnValue(
        makeStream([{ updateId, id: 's1', primaryAssetId: 'a1' }]),
      );

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.StacksV1] });

      const messages = parseChunks(chunks);
      expect(messages.some((m: any) => m.type === SyncEntityType.StackDeleteV1)).toBe(true);
      expect(messages.some((m: any) => m.type === SyncEntityType.StackV1)).toBe(true);
    });

    it('should handle PeopleV1 sync type', async () => {
      const { writable, chunks } = makeWritable();
      const deleteId = newUuid();
      const updateId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.person.getDeletes.mockReturnValue(makeStream([{ id: deleteId, personId: 'p1' }]));
      syncSubs.person.getUpserts.mockReturnValue(
        makeStream([{ updateId, id: 'p1', name: 'Person' }]),
      );

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.PeopleV1] });

      const messages = parseChunks(chunks);
      expect(messages.some((m: any) => m.type === SyncEntityType.PersonDeleteV1)).toBe(true);
      expect(messages.some((m: any) => m.type === SyncEntityType.PersonV1)).toBe(true);
    });

    it('should handle AssetFacesV2 sync type', async () => {
      const { writable, chunks } = makeWritable();
      const deleteId = newUuid();
      const updateId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.assetFace.getDeletes.mockReturnValue(makeStream([{ id: deleteId, assetFaceId: 'f1' }]));
      syncSubs.assetFace.getUpserts.mockReturnValue(
        makeStream([{ updateId, id: 'f1', assetId: 'a1', personId: 'p1', deletedAt: null, isVisible: true }]),
      );

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.AssetFacesV2] });

      const messages = parseChunks(chunks);
      expect(messages.some((m: any) => m.type === SyncEntityType.AssetFaceDeleteV1)).toBe(true);
      expect(messages.some((m: any) => m.type === SyncEntityType.AssetFaceV2)).toBe(true);
    });

    it('should handle AssetFacesV1 sync type and convert V2 to V1', async () => {
      const { writable, chunks } = makeWritable();
      const updateId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.assetFace.getDeletes.mockReturnValue(makeStream([]));
      syncSubs.assetFace.getUpserts.mockReturnValue(
        makeStream([
          {
            updateId,
            id: 'f1',
            assetId: 'a1',
            personId: 'p1',
            deletedAt: null,
            isVisible: true,
            boundingBoxX1: 0,
            boundingBoxY1: 0,
            boundingBoxX2: 100,
            boundingBoxY2: 100,
            imageHeight: 1000,
            imageWidth: 1000,
            sourceType: 'machine-learning',
          },
        ]),
      );

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.AssetFacesV1] });

      const messages = parseChunks(chunks);
      const faceMsg = messages.find((m: any) => m.type === SyncEntityType.AssetFaceV1);
      expect(faceMsg).toBeDefined();
      // V1 should not have deletedAt or isVisible
      expect(faceMsg.data.deletedAt).toBeUndefined();
      expect(faceMsg.data.isVisible).toBeUndefined();
    });

    it('should handle UserMetadataV1 sync type', async () => {
      const { writable, chunks } = makeWritable();
      const deleteId = newUuid();
      const updateId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.userMetadata.getDeletes.mockReturnValue(makeStream([{ id: deleteId, key: 'some-key' }]));
      syncSubs.userMetadata.getUpserts.mockReturnValue(
        makeStream([{ updateId, key: 'some-key', value: 'some-value' }]),
      );

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.UserMetadataV1] });

      const messages = parseChunks(chunks);
      expect(messages.some((m: any) => m.type === SyncEntityType.UserMetadataDeleteV1)).toBe(true);
      expect(messages.some((m: any) => m.type === SyncEntityType.UserMetadataV1)).toBe(true);
    });

    it('should handle AssetMetadataV1 sync type', async () => {
      const { writable, chunks } = makeWritable();
      const deleteId = newUuid();
      const updateId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.assetMetadata.getDeletes.mockReturnValue(makeStream([{ id: deleteId, assetId: 'a1' }]));
      syncSubs.assetMetadata.getUpserts.mockReturnValue(
        makeStream([{ updateId, assetId: 'a1', key: 'tag', value: 'beach' }]),
      );

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.AssetMetadataV1] });

      const messages = parseChunks(chunks);
      expect(messages.some((m: any) => m.type === SyncEntityType.AssetMetadataDeleteV1)).toBe(true);
      expect(messages.some((m: any) => m.type === SyncEntityType.AssetMetadataV1)).toBe(true);
    });

    it('should handle PartnerAssetsV1 with no partners and no checkpoint', async () => {
      const { writable, chunks } = makeWritable();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.partnerAsset.getDeletes.mockReturnValue(makeStream([]));
      syncSubs.partner.getCreatedAfter.mockResolvedValue([]);
      syncSubs.partnerAsset.getUpserts.mockReturnValue(makeStream([]));

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.PartnerAssetsV1] });

      const messages = parseChunks(chunks);
      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe(SyncEntityType.SyncCompleteV1);
    });

    it('should handle PartnerAssetsV1 with new partners and no upsert checkpoint', async () => {
      const { writable } = makeWritable();
      const partnerId = newUuid();
      const createId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.partnerAsset.getDeletes.mockReturnValue(makeStream([]));
      syncSubs.partner.getCreatedAfter.mockResolvedValue([{ sharedById: partnerId, createId }]);
      syncSubs.partnerAsset.getUpserts.mockReturnValue(makeStream([]));

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.PartnerAssetsV1] });

      expect(mocks.syncCheckpoint.upsertAll).toHaveBeenCalled();
    });

    it('should handle PartnerAssetsV1 backfill with upsert checkpoint', async () => {
      const { writable, chunks } = makeWritable();
      const partnerId = newUuid();
      const createId = newUuid();
      const updateId = newUuid();
      const checksum = Buffer.from('checksum');

      const upsertAck = toAck({ type: SyncEntityType.PartnerAssetV1, updateId: 'some-update-id' });

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([
        { type: SyncEntityType.PartnerAssetV1, ack: upsertAck },
      ]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.partnerAsset.getDeletes.mockReturnValue(makeStream([]));
      syncSubs.partner.getCreatedAfter.mockResolvedValue([{ sharedById: partnerId, createId }]);
      syncSubs.partnerAsset.getBackfill.mockReturnValue(
        makeStream([
          {
            updateId,
            id: 'pa1',
            ownerId: partnerId,
            type: 'IMAGE',
            checksum,
            thumbhash: null,
            isFavorite: false,
            visibility: AssetVisibility.Timeline,
            deletedAt: null,
          },
        ]),
      );
      syncSubs.partnerAsset.getUpserts.mockReturnValue(makeStream([]));

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.PartnerAssetsV1] });

      const messages = parseChunks(chunks);
      expect(messages.some((m: any) => m.type === SyncEntityType.PartnerAssetBackfillV1)).toBe(true);
      expect(messages.some((m: any) => m.type === SyncEntityType.SyncAckV1)).toBe(true);
    });

    it('should handle PartnerAssetExifsV1 backfill with upsert checkpoint', async () => {
      const { writable, chunks } = makeWritable();
      const partnerId = newUuid();
      const createId = newUuid();
      const updateId = newUuid();

      const upsertAck = toAck({ type: SyncEntityType.PartnerAssetExifV1, updateId: 'some-update-id' });

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([
        { type: SyncEntityType.PartnerAssetExifV1, ack: upsertAck },
      ]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.partner.getCreatedAfter.mockResolvedValue([{ sharedById: partnerId, createId }]);
      syncSubs.partnerAssetExif.getBackfill.mockReturnValue(
        makeStream([{ updateId, assetId: 'a1', city: 'Austin' }]),
      );
      syncSubs.partnerAssetExif.getUpserts.mockReturnValue(makeStream([]));

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.PartnerAssetExifsV1] });

      const messages = parseChunks(chunks);
      expect(messages.some((m: any) => m.type === SyncEntityType.PartnerAssetExifBackfillV1)).toBe(true);
    });

    it('should handle PartnerAssetExifsV1 with partners and no upsert checkpoint', async () => {
      const { writable } = makeWritable();
      const partnerId = newUuid();
      const createId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.partner.getCreatedAfter.mockResolvedValue([{ sharedById: partnerId, createId }]);
      syncSubs.partnerAssetExif.getUpserts.mockReturnValue(makeStream([]));

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.PartnerAssetExifsV1] });

      expect(mocks.syncCheckpoint.upsertAll).toHaveBeenCalled();
    });

    it('should handle AlbumUsersV1 with deletes, backfill, and upserts', async () => {
      const { writable, chunks } = makeWritable();
      const deleteId = newUuid();
      const albumId = newUuid();
      const createId = newUuid();
      const updateId = newUuid();

      const upsertAck = toAck({ type: SyncEntityType.AlbumUserV1, updateId: 'some-update-id' });

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([
        { type: SyncEntityType.AlbumUserV1, ack: upsertAck },
      ]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.albumUser.getDeletes.mockReturnValue(makeStream([{ id: deleteId, userId: 'u1', albumId }]));
      syncSubs.album.getCreatedAfter.mockResolvedValue([{ id: albumId, createId }]);
      syncSubs.albumUser.getBackfill.mockReturnValue(
        makeStream([{ updateId, userId: 'u1', albumId, role: 'viewer' }]),
      );
      syncSubs.albumUser.getUpserts.mockReturnValue(makeStream([]));

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.AlbumUsersV1] });

      const messages = parseChunks(chunks);
      expect(messages.some((m: any) => m.type === SyncEntityType.AlbumUserDeleteV1)).toBe(true);
      expect(messages.some((m: any) => m.type === SyncEntityType.AlbumUserBackfillV1)).toBe(true);
    });

    it('should handle AlbumUsersV1 with albums and no upsert checkpoint', async () => {
      const { writable } = makeWritable();
      const albumId = newUuid();
      const createId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.albumUser.getDeletes.mockReturnValue(makeStream([]));
      syncSubs.album.getCreatedAfter.mockResolvedValue([{ id: albumId, createId }]);
      syncSubs.albumUser.getUpserts.mockReturnValue(makeStream([]));

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.AlbumUsersV1] });

      expect(mocks.syncCheckpoint.upsertAll).toHaveBeenCalled();
    });

    it('should handle AlbumToAssetsV1 with deletes and upserts', async () => {
      const { writable, chunks } = makeWritable();
      const deleteId = newUuid();
      const updateId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.albumToAsset.getDeletes.mockReturnValue(makeStream([{ id: deleteId, albumId: 'alb1', assetId: 'a1' }]));
      syncSubs.album.getCreatedAfter.mockResolvedValue([]);
      syncSubs.albumToAsset.getUpserts.mockReturnValue(
        makeStream([{ updateId, albumId: 'alb1', assetId: 'a1' }]),
      );

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.AlbumToAssetsV1] });

      const messages = parseChunks(chunks);
      expect(messages.some((m: any) => m.type === SyncEntityType.AlbumToAssetDeleteV1)).toBe(true);
      expect(messages.some((m: any) => m.type === SyncEntityType.AlbumToAssetV1)).toBe(true);
    });

    it('should handle AlbumToAssetsV1 with albums and no upsert checkpoint', async () => {
      const { writable } = makeWritable();
      const albumId = newUuid();
      const createId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.albumToAsset.getDeletes.mockReturnValue(makeStream([]));
      syncSubs.album.getCreatedAfter.mockResolvedValue([{ id: albumId, createId }]);
      syncSubs.albumToAsset.getUpserts.mockReturnValue(makeStream([]));

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.AlbumToAssetsV1] });

      expect(mocks.syncCheckpoint.upsertAll).toHaveBeenCalled();
    });

    it('should handle PartnerStacksV1 with deletes and upserts', async () => {
      const { writable, chunks } = makeWritable();
      const deleteId = newUuid();
      const updateId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.partnerStack.getDeletes.mockReturnValue(makeStream([{ id: deleteId, stackId: 's1' }]));
      syncSubs.partner.getCreatedAfter.mockResolvedValue([]);
      syncSubs.partnerStack.getUpserts.mockReturnValue(
        makeStream([{ updateId, id: 's1', primaryAssetId: 'a1' }]),
      );

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.PartnerStacksV1] });

      const messages = parseChunks(chunks);
      expect(messages.some((m: any) => m.type === SyncEntityType.PartnerStackDeleteV1)).toBe(true);
      expect(messages.some((m: any) => m.type === SyncEntityType.PartnerStackV1)).toBe(true);
    });

    it('should handle PartnerStacksV1 with partners and no upsert checkpoint', async () => {
      const { writable } = makeWritable();
      const partnerId = newUuid();
      const createId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.partnerStack.getDeletes.mockReturnValue(makeStream([]));
      syncSubs.partner.getCreatedAfter.mockResolvedValue([{ sharedById: partnerId, createId }]);
      syncSubs.partnerStack.getUpserts.mockReturnValue(makeStream([]));

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.PartnerStacksV1] });

      expect(mocks.syncCheckpoint.upsertAll).toHaveBeenCalled();
    });

    it('should handle PartnerStacksV1 backfill with upsert checkpoint', async () => {
      const { writable, chunks } = makeWritable();
      const partnerId = newUuid();
      const createId = newUuid();
      const updateId = newUuid();

      const upsertAck = toAck({ type: SyncEntityType.PartnerStackV1, updateId: 'some-update-id' });

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([
        { type: SyncEntityType.PartnerStackV1, ack: upsertAck },
      ]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.partnerStack.getDeletes.mockReturnValue(makeStream([]));
      syncSubs.partner.getCreatedAfter.mockResolvedValue([{ sharedById: partnerId, createId }]);
      syncSubs.partnerStack.getBackfill.mockReturnValue(
        makeStream([{ updateId, id: 'ps1', primaryAssetId: 'a1' }]),
      );
      syncSubs.partnerStack.getUpserts.mockReturnValue(makeStream([]));

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.PartnerStacksV1] });

      const messages = parseChunks(chunks);
      expect(messages.some((m: any) => m.type === SyncEntityType.PartnerStackBackfillV1)).toBe(true);
    });

    it('should handle AlbumAssetsV1 with creates', async () => {
      const { writable, chunks } = makeWritable();
      const updateId = newUuid();
      const checksum = Buffer.from('checksum');

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.album.getCreatedAfter.mockResolvedValue([]);
      syncSubs.albumAsset.getCreates.mockReturnValue(
        makeStream([
          {
            updateId,
            id: 'aa1',
            ownerId: 'u1',
            type: 'IMAGE',
            checksum,
            thumbhash: null,
            isFavorite: false,
            visibility: AssetVisibility.Timeline,
            deletedAt: null,
          },
        ]),
      );

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.AlbumAssetsV1] });

      const messages = parseChunks(chunks);
      expect(messages.some((m: any) => m.type === SyncEntityType.AlbumAssetCreateV1)).toBe(true);
      expect(messages.some((m: any) => m.type === SyncEntityType.SyncAckV1)).toBe(true);
    });

    it('should handle AlbumAssetsV1 with updates when create checkpoint exists', async () => {
      const { writable, chunks } = makeWritable();
      const updateId = newUuid();
      const checksum = Buffer.from('checksum');

      const createAck = toAck({ type: SyncEntityType.AlbumAssetCreateV1, updateId: 'create-ack-id' });

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([
        { type: SyncEntityType.AlbumAssetCreateV1, ack: createAck },
      ]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.album.getCreatedAfter.mockResolvedValue([]);
      syncSubs.albumAsset.getUpdates.mockReturnValue(
        makeStream([
          {
            updateId,
            id: 'aa1',
            ownerId: 'u1',
            type: 'IMAGE',
            checksum,
            thumbhash: null,
            isFavorite: false,
            visibility: AssetVisibility.Timeline,
            deletedAt: null,
          },
        ]),
      );
      syncSubs.albumAsset.getCreates.mockReturnValue(makeStream([]));

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.AlbumAssetsV1] });

      const messages = parseChunks(chunks);
      expect(messages.some((m: any) => m.type === SyncEntityType.AlbumAssetUpdateV1)).toBe(true);
    });

    it('should handle AlbumAssetsV1 with albums and no create checkpoint', async () => {
      const { writable } = makeWritable();
      const albumId = newUuid();
      const createId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.album.getCreatedAfter.mockResolvedValue([{ id: albumId, createId }]);
      syncSubs.albumAsset.getCreates.mockReturnValue(makeStream([]));

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.AlbumAssetsV1] });

      expect(mocks.syncCheckpoint.upsertAll).toHaveBeenCalled();
    });

    it('should handle AlbumAssetExifsV1 with creates', async () => {
      const { writable, chunks } = makeWritable();
      const updateId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.album.getCreatedAfter.mockResolvedValue([]);
      syncSubs.albumAssetExif.getCreates.mockReturnValue(
        makeStream([{ updateId, assetId: 'a1', city: 'Austin' }]),
      );

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.AlbumAssetExifsV1] });

      const messages = parseChunks(chunks);
      expect(messages.some((m: any) => m.type === SyncEntityType.AlbumAssetExifCreateV1)).toBe(true);
      expect(messages.some((m: any) => m.type === SyncEntityType.SyncAckV1)).toBe(true);
    });

    it('should handle AlbumAssetExifsV1 with updates when create checkpoint exists', async () => {
      const { writable, chunks } = makeWritable();
      const updateId = newUuid();

      const createAck = toAck({ type: SyncEntityType.AlbumAssetExifCreateV1, updateId: 'create-ack-id' });

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([
        { type: SyncEntityType.AlbumAssetExifCreateV1, ack: createAck },
      ]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.album.getCreatedAfter.mockResolvedValue([]);
      syncSubs.albumAssetExif.getUpdates.mockReturnValue(
        makeStream([{ updateId, assetId: 'a1', city: 'Austin' }]),
      );
      syncSubs.albumAssetExif.getCreates.mockReturnValue(makeStream([]));

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.AlbumAssetExifsV1] });

      const messages = parseChunks(chunks);
      expect(messages.some((m: any) => m.type === SyncEntityType.AlbumAssetExifUpdateV1)).toBe(true);
    });

    it('should handle AlbumAssetExifsV1 with albums and no create checkpoint', async () => {
      const { writable } = makeWritable();
      const albumId = newUuid();
      const createId = newUuid();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.album.getCreatedAfter.mockResolvedValue([{ id: albumId, createId }]);
      syncSubs.albumAssetExif.getCreates.mockReturnValue(makeStream([]));

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.AlbumAssetExifsV1] });

      expect(mocks.syncCheckpoint.upsertAll).toHaveBeenCalled();
    });

    it('should only process requested types in SYNC_TYPES_ORDER', async () => {
      const { writable } = makeWritable();

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.AssetsV1] });

      // Should not call user sync methods
      expect(syncSubs.user.getDeletes).not.toHaveBeenCalled();
      expect(syncSubs.user.getUpserts).not.toHaveBeenCalled();
      // Should call asset sync methods
      expect(syncSubs.asset.getDeletes).toHaveBeenCalled();
      expect(syncSubs.asset.getUpserts).toHaveBeenCalled();
    });

    it('should skip backfill when entity backfill is already complete', async () => {
      const { writable } = makeWritable();
      const partnerId = newUuid();
      const createId = newUuid();

      const upsertAck = toAck({ type: SyncEntityType.PartnerAssetV1, updateId: 'some-update-id' });
      const backfillAck = toAck({ type: SyncEntityType.PartnerAssetBackfillV1, updateId: createId, extraId: 'complete' });

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([
        { type: SyncEntityType.PartnerAssetV1, ack: upsertAck },
        { type: SyncEntityType.PartnerAssetBackfillV1, ack: backfillAck },
      ]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.partnerAsset.getDeletes.mockReturnValue(makeStream([]));
      syncSubs.partner.getCreatedAfter.mockResolvedValue([{ sharedById: partnerId, createId }]);
      syncSubs.partnerAsset.getUpserts.mockReturnValue(makeStream([]));

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.PartnerAssetsV1] });

      expect(syncSubs.partnerAsset.getBackfill).not.toHaveBeenCalled();
    });

    it('should resume backfill from checkpoint when partially complete', async () => {
      const { writable } = makeWritable();
      const partnerId = newUuid();
      const createId = newUuid();
      const partialExtraId = newUuid();

      const upsertAck = toAck({ type: SyncEntityType.PartnerAssetV1, updateId: 'some-update-id' });
      const backfillAck = toAck({
        type: SyncEntityType.PartnerAssetBackfillV1,
        updateId: createId,
        extraId: partialExtraId,
      });

      mocks.session.isPendingSyncReset.mockResolvedValue(false);
      mocks.syncCheckpoint.getAll.mockResolvedValue([
        { type: SyncEntityType.PartnerAssetV1, ack: upsertAck },
        { type: SyncEntityType.PartnerAssetBackfillV1, ack: backfillAck },
      ]);
      mocks.syncCheckpoint.getNow.mockResolvedValue({ nowId: 'now-id' });
      syncSubs.partnerAsset.getDeletes.mockReturnValue(makeStream([]));
      syncSubs.partner.getCreatedAfter.mockResolvedValue([{ sharedById: partnerId, createId }]);
      syncSubs.partnerAsset.getBackfill.mockReturnValue(makeStream([]));
      syncSubs.partnerAsset.getUpserts.mockReturnValue(makeStream([]));

      await sut.stream(authStub.user1, writable, { types: [SyncRequestType.PartnerAssetsV1] });

      expect(syncSubs.partnerAsset.getBackfill).toHaveBeenCalledWith(
        expect.objectContaining({ afterUpdateId: partialExtraId }),
        partnerId,
      );
    });
  });

  describe('onAuditTableCleanup', () => {
    it('should cleanup all audit tables', async () => {
      await sut.onAuditTableCleanup();

      expect(syncSubs.album.cleanupAuditTable).toHaveBeenCalledWith(31);
      expect(syncSubs.albumUser.cleanupAuditTable).toHaveBeenCalledWith(31);
      expect(syncSubs.albumToAsset.cleanupAuditTable).toHaveBeenCalledWith(31);
      expect(syncSubs.asset.cleanupAuditTable).toHaveBeenCalledWith(31);
      expect(syncSubs.assetFace.cleanupAuditTable).toHaveBeenCalledWith(31);
      expect(syncSubs.assetMetadata.cleanupAuditTable).toHaveBeenCalledWith(31);
      expect(syncSubs.assetEdit.cleanupAuditTable).toHaveBeenCalledWith(31);
      expect(syncSubs.memory.cleanupAuditTable).toHaveBeenCalledWith(31);
      expect(syncSubs.memoryToAsset.cleanupAuditTable).toHaveBeenCalledWith(31);
      expect(syncSubs.partner.cleanupAuditTable).toHaveBeenCalledWith(31);
      expect(syncSubs.person.cleanupAuditTable).toHaveBeenCalledWith(31);
      expect(syncSubs.stack.cleanupAuditTable).toHaveBeenCalledWith(31);
      expect(syncSubs.user.cleanupAuditTable).toHaveBeenCalledWith(31);
      expect(syncSubs.userMetadata.cleanupAuditTable).toHaveBeenCalledWith(31);
    });
  });

  describe('getFullSync', () => {
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

    it('should use provided userId when specified', async () => {
      const userId = newUuid();
      mocks.asset.getAllForUserFullSync.mockResolvedValue([]);
      mocks.access.timeline.checkPartnerAccess.mockResolvedValue(new Set([userId]));

      await sut.getFullSync(authStub.user1, { limit: 10, updatedUntil: untilDate, userId });

      expect(mocks.asset.getAllForUserFullSync).toHaveBeenCalledWith({
        ownerId: userId,
        updatedUntil: untilDate,
        limit: 10,
      });
    });
  });

  describe('getDeltaSync', () => {
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

    it('should filter out archived partner assets from delta sync', async () => {
      const ownAsset = AssetFactory.create({ ownerId: authStub.user1.user.id });
      const partnerAssetTimeline = AssetFactory.create({
        ownerId: 'partner-id',
        visibility: AssetVisibility.Timeline,
      });
      const partnerAssetArchived = AssetFactory.create({
        ownerId: 'partner-id',
        visibility: AssetVisibility.Archive,
      });

      mocks.partner.getAll.mockResolvedValue([
        factory.partner({
          sharedById: 'partner-id',
          sharedWithId: authStub.user1.user.id,
        }),
      ]);
      mocks.asset.getChangedDeltaSync.mockResolvedValue([ownAsset, partnerAssetTimeline, partnerAssetArchived]);
      mocks.audit.getAfter.mockResolvedValue([]);
      mocks.access.timeline.checkPartnerAccess.mockResolvedValue(new Set(['partner-id']));

      const result = await sut.getDeltaSync(authStub.user1, {
        updatedAfter: new Date(),
        userIds: [authStub.user1.user.id, 'partner-id'],
      });

      expect(result.needsFullSync).toBe(false);
      // Should include own asset and partner timeline asset, but not partner archived asset
      expect(result.upserted).toHaveLength(2);
    });
  });
});
