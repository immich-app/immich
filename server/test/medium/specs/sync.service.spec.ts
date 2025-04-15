import { AuthDto } from 'src/dtos/auth.dto';
import { SyncEntityType, SyncRequestType } from 'src/enum';
import { SYNC_TYPES_ORDER, SyncService } from 'src/services/sync.service';
import { mediumFactory, newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

const setup = async () => {
  const db = await getKyselyDB();

  const { sut, mocks, repos, getRepository } = newMediumService(SyncService, {
    database: db,
    repos: {
      sync: 'real',
      session: 'real',
    },
  });

  const user = mediumFactory.userInsert();
  const session = mediumFactory.sessionInsert({ userId: user.id });
  const auth = factory.auth({
    session,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });

  await getRepository('user').create(user);
  await getRepository('session').create(session);

  const testSync = async (auth: AuthDto, types: SyncRequestType[]) => {
    const stream = mediumFactory.syncStream();
    // Wait for 1ms to ensure all updates are available
    await new Promise((resolve) => setTimeout(resolve, 1));
    await sut.stream(auth, stream, { types });

    return stream.getResponse();
  };

  return {
    sut,
    auth,
    mocks,
    repos,
    getRepository,
    testSync,
  };
};

describe(SyncService.name, () => {
  it('should have all the types in the ordering variable', () => {
    for (const key in SyncRequestType) {
      expect(SYNC_TYPES_ORDER).includes(key);
    }

    expect(SYNC_TYPES_ORDER.length).toBe(Object.keys(SyncRequestType).length);
  });

  describe.concurrent(SyncEntityType.UserV1, () => {
    it('should detect and sync the first user', async () => {
      const { auth, sut, getRepository, testSync } = await setup();

      const userRepo = getRepository('user');
      const user = await userRepo.get(auth.user.id, { withDeleted: false });
      if (!user) {
        expect.fail('First user should exist');
      }

      const initialSyncResponse = await testSync(auth, [SyncRequestType.UsersV1]);
      expect(initialSyncResponse).toHaveLength(1);
      expect(initialSyncResponse).toEqual([
        {
          ack: expect.any(String),
          data: {
            deletedAt: user.deletedAt,
            email: user.email,
            id: user.id,
            name: user.name,
          },
          type: 'UserV1',
        },
      ]);

      const acks = [initialSyncResponse[0].ack];
      await sut.setAcks(auth, { acks });
      const ackSyncResponse = await testSync(auth, [SyncRequestType.UsersV1]);

      expect(ackSyncResponse).toHaveLength(0);
    });

    it('should detect and sync a soft deleted user', async () => {
      const { auth, sut, getRepository, testSync } = await setup();

      const deletedAt = new Date().toISOString();
      const deletedUser = mediumFactory.userInsert({ deletedAt });
      const deleted = await getRepository('user').create(deletedUser);

      const response = await testSync(auth, [SyncRequestType.UsersV1]);

      expect(response).toHaveLength(2);
      expect(response).toEqual(
        expect.arrayContaining([
          {
            ack: expect.any(String),
            data: {
              deletedAt: null,
              email: auth.user.email,
              id: auth.user.id,
              name: auth.user.name,
            },
            type: 'UserV1',
          },
          {
            ack: expect.any(String),
            data: {
              deletedAt,
              email: deleted.email,
              id: deleted.id,
              name: deleted.name,
            },
            type: 'UserV1',
          },
        ]),
      );

      const acks = [response[1].ack];
      await sut.setAcks(auth, { acks });
      const ackSyncResponse = await testSync(auth, [SyncRequestType.UsersV1]);

      expect(ackSyncResponse).toHaveLength(0);
    });

    it('should detect and sync a deleted user', async () => {
      const { auth, sut, getRepository, testSync } = await setup();

      const userRepo = getRepository('user');
      const user = mediumFactory.userInsert();
      await userRepo.create(user);
      await userRepo.delete({ id: user.id }, true);

      const response = await testSync(auth, [SyncRequestType.UsersV1]);

      expect(response).toHaveLength(2);
      expect(response).toEqual(
        expect.arrayContaining([
          {
            ack: expect.any(String),
            data: {
              userId: user.id,
            },
            type: 'UserDeleteV1',
          },
          {
            ack: expect.any(String),
            data: {
              deletedAt: null,
              email: auth.user.email,
              id: auth.user.id,
              name: auth.user.name,
            },
            type: 'UserV1',
          },
        ]),
      );

      const acks = response.map(({ ack }) => ack);
      await sut.setAcks(auth, { acks });
      const ackSyncResponse = await testSync(auth, [SyncRequestType.UsersV1]);

      expect(ackSyncResponse).toHaveLength(0);
    });

    it('should sync a user and then an update to that same user', async () => {
      const { auth, sut, getRepository, testSync } = await setup();

      const initialSyncResponse = await testSync(auth, [SyncRequestType.UsersV1]);

      expect(initialSyncResponse).toHaveLength(1);
      expect(initialSyncResponse).toEqual(
        expect.arrayContaining([
          {
            ack: expect.any(String),
            data: {
              deletedAt: null,
              email: auth.user.email,
              id: auth.user.id,
              name: auth.user.name,
            },
            type: 'UserV1',
          },
        ]),
      );

      const acks = [initialSyncResponse[0].ack];
      await sut.setAcks(auth, { acks });

      const userRepo = getRepository('user');
      const updated = await userRepo.update(auth.user.id, { name: 'new name' });
      const updatedSyncResponse = await testSync(auth, [SyncRequestType.UsersV1]);

      expect(updatedSyncResponse).toHaveLength(1);
      expect(updatedSyncResponse).toEqual(
        expect.arrayContaining([
          {
            ack: expect.any(String),
            data: {
              deletedAt: null,
              email: auth.user.email,
              id: auth.user.id,
              name: updated.name,
            },
            type: 'UserV1',
          },
        ]),
      );
    });
  });

  describe.concurrent(SyncEntityType.PartnerV1, () => {
    it('should detect and sync the first partner', async () => {
      const { auth, sut, getRepository, testSync } = await setup();

      const user1 = auth.user;
      const userRepo = getRepository('user');
      const partnerRepo = getRepository('partner');

      const user2 = mediumFactory.userInsert();
      await userRepo.create(user2);

      const partner = await partnerRepo.create({ sharedById: user2.id, sharedWithId: user1.id });

      const initialSyncResponse = await testSync(auth, [SyncRequestType.PartnersV1]);

      expect(initialSyncResponse).toHaveLength(1);
      expect(initialSyncResponse).toEqual(
        expect.arrayContaining([
          {
            ack: expect.any(String),
            data: {
              inTimeline: partner.inTimeline,
              sharedById: partner.sharedById,
              sharedWithId: partner.sharedWithId,
            },
            type: 'PartnerV1',
          },
        ]),
      );

      const acks = [initialSyncResponse[0].ack];
      await sut.setAcks(auth, { acks });

      const ackSyncResponse = await testSync(auth, [SyncRequestType.PartnersV1]);

      expect(ackSyncResponse).toHaveLength(0);
    });

    it('should detect and sync a deleted partner', async () => {
      const { auth, sut, getRepository, testSync } = await setup();

      const userRepo = getRepository('user');
      const user1 = auth.user;
      const user2 = mediumFactory.userInsert();
      await userRepo.create(user2);

      const partnerRepo = getRepository('partner');
      const partner = await partnerRepo.create({ sharedById: user2.id, sharedWithId: user1.id });
      await partnerRepo.remove(partner);

      const response = await testSync(auth, [SyncRequestType.PartnersV1]);

      expect(response).toHaveLength(1);
      expect(response).toEqual(
        expect.arrayContaining([
          {
            ack: expect.any(String),
            data: {
              sharedById: partner.sharedById,
              sharedWithId: partner.sharedWithId,
            },
            type: 'PartnerDeleteV1',
          },
        ]),
      );

      const acks = response.map(({ ack }) => ack);
      await sut.setAcks(auth, { acks });

      const ackSyncResponse = await testSync(auth, [SyncRequestType.PartnersV1]);

      expect(ackSyncResponse).toHaveLength(0);
    });

    it('should detect and sync a partner share both to and from another user', async () => {
      const { auth, sut, getRepository, testSync } = await setup();

      const userRepo = getRepository('user');
      const user1 = auth.user;
      const user2 = await userRepo.create(mediumFactory.userInsert());

      const partnerRepo = getRepository('partner');
      const partner1 = await partnerRepo.create({ sharedById: user2.id, sharedWithId: user1.id });
      const partner2 = await partnerRepo.create({ sharedById: user1.id, sharedWithId: user2.id });

      const response = await testSync(auth, [SyncRequestType.PartnersV1]);

      expect(response).toHaveLength(2);
      expect(response).toEqual(
        expect.arrayContaining([
          {
            ack: expect.any(String),
            data: {
              inTimeline: partner1.inTimeline,
              sharedById: partner1.sharedById,
              sharedWithId: partner1.sharedWithId,
            },
            type: 'PartnerV1',
          },
          {
            ack: expect.any(String),
            data: {
              inTimeline: partner2.inTimeline,
              sharedById: partner2.sharedById,
              sharedWithId: partner2.sharedWithId,
            },
            type: 'PartnerV1',
          },
        ]),
      );

      await sut.setAcks(auth, { acks: [response[1].ack] });

      const ackSyncResponse = await testSync(auth, [SyncRequestType.PartnersV1]);

      expect(ackSyncResponse).toHaveLength(0);
    });

    it('should sync a partner and then an update to that same partner', async () => {
      const { auth, sut, getRepository, testSync } = await setup();

      const userRepo = getRepository('user');
      const user1 = auth.user;
      const user2 = await userRepo.create(mediumFactory.userInsert());

      const partnerRepo = getRepository('partner');
      const partner = await partnerRepo.create({ sharedById: user2.id, sharedWithId: user1.id });

      const initialSyncResponse = await testSync(auth, [SyncRequestType.PartnersV1]);

      expect(initialSyncResponse).toHaveLength(1);
      expect(initialSyncResponse).toEqual(
        expect.arrayContaining([
          {
            ack: expect.any(String),
            data: {
              inTimeline: partner.inTimeline,
              sharedById: partner.sharedById,
              sharedWithId: partner.sharedWithId,
            },
            type: 'PartnerV1',
          },
        ]),
      );

      const acks = [initialSyncResponse[0].ack];
      await sut.setAcks(auth, { acks });

      const updated = await partnerRepo.update(
        { sharedById: partner.sharedById, sharedWithId: partner.sharedWithId },
        { inTimeline: true },
      );

      const updatedSyncResponse = await testSync(auth, [SyncRequestType.PartnersV1]);

      expect(updatedSyncResponse).toHaveLength(1);
      expect(updatedSyncResponse).toEqual(
        expect.arrayContaining([
          {
            ack: expect.any(String),
            data: {
              inTimeline: updated.inTimeline,
              sharedById: updated.sharedById,
              sharedWithId: updated.sharedWithId,
            },
            type: 'PartnerV1',
          },
        ]),
      );
    });

    it('should not sync a partner or partner delete for an unrelated user', async () => {
      const { auth, getRepository, testSync } = await setup();

      const userRepo = getRepository('user');
      const user2 = await userRepo.create(mediumFactory.userInsert());
      const user3 = await userRepo.create(mediumFactory.userInsert());

      const partnerRepo = getRepository('partner');
      const partner = await partnerRepo.create({ sharedById: user2.id, sharedWithId: user3.id });

      expect(await testSync(auth, [SyncRequestType.PartnersV1])).toHaveLength(0);

      await partnerRepo.remove(partner);

      expect(await testSync(auth, [SyncRequestType.PartnersV1])).toHaveLength(0);
    });

    it('should not sync a partner delete after a user is deleted', async () => {
      const { auth, getRepository, testSync } = await setup();

      const userRepo = getRepository('user');
      const user2 = await userRepo.create(mediumFactory.userInsert());

      const partnerRepo = getRepository('partner');
      await partnerRepo.create({ sharedById: user2.id, sharedWithId: auth.user.id });
      await userRepo.delete({ id: user2.id }, true);

      expect(await testSync(auth, [SyncRequestType.PartnersV1])).toHaveLength(0);
    });
  });

  describe.concurrent(SyncEntityType.AssetV1, () => {
    it('should detect and sync the first asset', async () => {
      const { auth, sut, getRepository, testSync } = await setup();

      const checksum = '1115vHcVkZzNp3Q9G+FEA0nu6zUbGb4Tj4UOXkN0wRA=';
      const thumbhash = '2225vHcVkZzNp3Q9G+FEA0nu6zUbGb4Tj4UOXkN0wRA=';
      const date = new Date().toISOString();

      const assetRepo = getRepository('asset');
      const asset = mediumFactory.assetInsert({
        ownerId: auth.user.id,
        checksum: Buffer.from(checksum, 'base64'),
        thumbhash: Buffer.from(thumbhash, 'base64'),
        fileCreatedAt: date,
        fileModifiedAt: date,
        localDateTime: date,
        deletedAt: null,
      });
      await assetRepo.create(asset);

      const initialSyncResponse = await testSync(auth, [SyncRequestType.AssetsV1]);

      expect(initialSyncResponse).toHaveLength(1);
      expect(initialSyncResponse).toEqual(
        expect.arrayContaining([
          {
            ack: expect.any(String),
            data: {
              id: asset.id,
              ownerId: asset.ownerId,
              thumbhash,
              checksum,
              deletedAt: asset.deletedAt,
              fileCreatedAt: asset.fileCreatedAt,
              fileModifiedAt: asset.fileModifiedAt,
              isFavorite: asset.isFavorite,
              isVisible: asset.isVisible,
              localDateTime: asset.localDateTime,
              type: asset.type,
            },
            type: 'AssetV1',
          },
        ]),
      );

      const acks = [initialSyncResponse[0].ack];
      await sut.setAcks(auth, { acks });

      const ackSyncResponse = await testSync(auth, [SyncRequestType.AssetsV1]);

      expect(ackSyncResponse).toHaveLength(0);
    });

    it('should detect and sync a deleted asset', async () => {
      const { auth, sut, getRepository, testSync } = await setup();

      const assetRepo = getRepository('asset');
      const asset = mediumFactory.assetInsert({ ownerId: auth.user.id });
      await assetRepo.create(asset);
      await assetRepo.remove(asset);

      const response = await testSync(auth, [SyncRequestType.AssetsV1]);

      expect(response).toHaveLength(1);
      expect(response).toEqual(
        expect.arrayContaining([
          {
            ack: expect.any(String),
            data: {
              assetId: asset.id,
            },
            type: 'AssetDeleteV1',
          },
        ]),
      );

      const acks = response.map(({ ack }) => ack);
      await sut.setAcks(auth, { acks });

      const ackSyncResponse = await testSync(auth, [SyncRequestType.AssetsV1]);

      expect(ackSyncResponse).toHaveLength(0);
    });

    it('should not sync an asset or asset delete for an unrelated user', async () => {
      const { auth, getRepository, testSync } = await setup();

      const userRepo = getRepository('user');
      const user2 = mediumFactory.userInsert();
      await userRepo.create(user2);

      const sessionRepo = getRepository('session');
      const session = mediumFactory.sessionInsert({ userId: user2.id });
      await sessionRepo.create(session);

      const assetRepo = getRepository('asset');
      const asset = mediumFactory.assetInsert({ ownerId: user2.id });
      await assetRepo.create(asset);

      const auth2 = factory.auth({ session, user: user2 });

      expect(await testSync(auth2, [SyncRequestType.AssetsV1])).toHaveLength(1);
      expect(await testSync(auth, [SyncRequestType.AssetsV1])).toHaveLength(0);

      await assetRepo.remove(asset);
      expect(await testSync(auth2, [SyncRequestType.AssetsV1])).toHaveLength(1);
      expect(await testSync(auth, [SyncRequestType.AssetsV1])).toHaveLength(0);
    });
  });

  describe.concurrent(SyncRequestType.PartnerAssetsV1, () => {
    it('should detect and sync the first partner asset', async () => {
      const { auth, sut, getRepository, testSync } = await setup();

      const checksum = '1115vHcVkZzNp3Q9G+FEA0nu6zUbGb4Tj4UOXkN0wRA=';
      const thumbhash = '2225vHcVkZzNp3Q9G+FEA0nu6zUbGb4Tj4UOXkN0wRA=';
      const date = new Date().toISOString();

      const userRepo = getRepository('user');
      const user2 = mediumFactory.userInsert();
      await userRepo.create(user2);

      const assetRepo = getRepository('asset');
      const asset = mediumFactory.assetInsert({
        ownerId: user2.id,
        checksum: Buffer.from(checksum, 'base64'),
        thumbhash: Buffer.from(thumbhash, 'base64'),
        fileCreatedAt: date,
        fileModifiedAt: date,
        localDateTime: date,
        deletedAt: null,
      });
      await assetRepo.create(asset);

      const partnerRepo = getRepository('partner');
      await partnerRepo.create({ sharedById: user2.id, sharedWithId: auth.user.id });

      const initialSyncResponse = await testSync(auth, [SyncRequestType.PartnerAssetsV1]);

      expect(initialSyncResponse).toHaveLength(1);
      expect(initialSyncResponse).toEqual(
        expect.arrayContaining([
          {
            ack: expect.any(String),
            data: {
              id: asset.id,
              ownerId: asset.ownerId,
              thumbhash,
              checksum,
              deletedAt: null,
              fileCreatedAt: date,
              fileModifiedAt: date,
              isFavorite: false,
              isVisible: true,
              localDateTime: date,
              type: asset.type,
            },
            type: SyncEntityType.PartnerAssetV1,
          },
        ]),
      );

      const acks = [initialSyncResponse[0].ack];
      await sut.setAcks(auth, { acks });

      const ackSyncResponse = await testSync(auth, [SyncRequestType.PartnerAssetsV1]);

      expect(ackSyncResponse).toHaveLength(0);
    });

    it('should detect and sync a deleted partner asset', async () => {
      const { auth, sut, getRepository, testSync } = await setup();

      const userRepo = getRepository('user');
      const user2 = mediumFactory.userInsert();
      await userRepo.create(user2);
      const asset = mediumFactory.assetInsert({ ownerId: user2.id });

      const assetRepo = getRepository('asset');
      await assetRepo.create(asset);

      const partnerRepo = getRepository('partner');
      await partnerRepo.create({ sharedById: user2.id, sharedWithId: auth.user.id });
      await assetRepo.remove(asset);

      const response = await testSync(auth, [SyncRequestType.PartnerAssetsV1]);

      expect(response).toHaveLength(1);
      expect(response).toEqual(
        expect.arrayContaining([
          {
            ack: expect.any(String),
            data: {
              assetId: asset.id,
            },
            type: SyncEntityType.PartnerAssetDeleteV1,
          },
        ]),
      );

      const acks = response.map(({ ack }) => ack);
      await sut.setAcks(auth, { acks });

      const ackSyncResponse = await testSync(auth, [SyncRequestType.PartnerAssetsV1]);

      expect(ackSyncResponse).toHaveLength(0);
    });

    it('should not sync a deleted partner asset due to a user delete', async () => {
      const { auth, getRepository, testSync } = await setup();

      const userRepo = getRepository('user');
      const user2 = mediumFactory.userInsert();
      await userRepo.create(user2);

      const partnerRepo = getRepository('partner');
      await partnerRepo.create({ sharedById: user2.id, sharedWithId: auth.user.id });

      const assetRepo = getRepository('asset');
      await assetRepo.create(mediumFactory.assetInsert({ ownerId: user2.id }));

      await userRepo.delete({ id: user2.id }, true);

      const response = await testSync(auth, [SyncRequestType.PartnerAssetsV1]);
      expect(response).toHaveLength(0);
    });

    it('should not sync a deleted partner asset due to a partner delete (unshare)', async () => {
      const { auth, getRepository, testSync } = await setup();

      const userRepo = getRepository('user');
      const user2 = mediumFactory.userInsert();
      await userRepo.create(user2);

      const assetRepo = getRepository('asset');
      await assetRepo.create(mediumFactory.assetInsert({ ownerId: user2.id }));

      const partnerRepo = getRepository('partner');
      const partner = { sharedById: user2.id, sharedWithId: auth.user.id };
      await partnerRepo.create(partner);

      await expect(testSync(auth, [SyncRequestType.PartnerAssetsV1])).resolves.toHaveLength(1);

      await partnerRepo.remove(partner);

      await expect(testSync(auth, [SyncRequestType.PartnerAssetsV1])).resolves.toHaveLength(0);
    });

    it('should not sync an asset or asset delete for own user', async () => {
      const { auth, getRepository, testSync } = await setup();

      const userRepo = getRepository('user');
      const user2 = mediumFactory.userInsert();
      await userRepo.create(user2);

      const assetRepo = getRepository('asset');
      const asset = mediumFactory.assetInsert({ ownerId: auth.user.id });
      await assetRepo.create(asset);

      const partnerRepo = getRepository('partner');
      await partnerRepo.create({ sharedById: user2.id, sharedWithId: auth.user.id });

      await expect(testSync(auth, [SyncRequestType.AssetsV1])).resolves.toHaveLength(1);
      await expect(testSync(auth, [SyncRequestType.PartnerAssetsV1])).resolves.toHaveLength(0);

      await assetRepo.remove(asset);

      await expect(testSync(auth, [SyncRequestType.AssetsV1])).resolves.toHaveLength(1);
      await expect(testSync(auth, [SyncRequestType.PartnerAssetsV1])).resolves.toHaveLength(0);
    });

    it('should not sync an asset or asset delete for unrelated user', async () => {
      const { auth, getRepository, testSync } = await setup();

      const userRepo = getRepository('user');
      const user2 = mediumFactory.userInsert();
      await userRepo.create(user2);

      const sessionRepo = getRepository('session');
      const session = mediumFactory.sessionInsert({ userId: user2.id });
      await sessionRepo.create(session);

      const auth2 = factory.auth({ session, user: user2 });

      const assetRepo = getRepository('asset');
      const asset = mediumFactory.assetInsert({ ownerId: user2.id });
      await assetRepo.create(asset);

      await expect(testSync(auth2, [SyncRequestType.AssetsV1])).resolves.toHaveLength(1);
      await expect(testSync(auth, [SyncRequestType.PartnerAssetsV1])).resolves.toHaveLength(0);

      await assetRepo.remove(asset);

      await expect(testSync(auth2, [SyncRequestType.AssetsV1])).resolves.toHaveLength(1);
      await expect(testSync(auth, [SyncRequestType.PartnerAssetsV1])).resolves.toHaveLength(0);
    });
  });

  describe.concurrent(SyncRequestType.AssetExifsV1, () => {
    it('should detect and sync the first asset exif', async () => {
      const { auth, sut, getRepository, testSync } = await setup();

      const assetRepo = getRepository('asset');
      const asset = mediumFactory.assetInsert({ ownerId: auth.user.id });
      await assetRepo.create(asset);
      await assetRepo.upsertExif({ assetId: asset.id, make: 'Canon' });

      const initialSyncResponse = await testSync(auth, [SyncRequestType.AssetExifsV1]);

      expect(initialSyncResponse).toHaveLength(1);
      expect(initialSyncResponse).toEqual(
        expect.arrayContaining([
          {
            ack: expect.any(String),
            data: {
              assetId: asset.id,
              city: null,
              country: null,
              dateTimeOriginal: null,
              description: '',
              exifImageHeight: null,
              exifImageWidth: null,
              exposureTime: null,
              fNumber: null,
              fileSizeInByte: null,
              focalLength: null,
              fps: null,
              iso: null,
              latitude: null,
              lensModel: null,
              longitude: null,
              make: 'Canon',
              model: null,
              modifyDate: null,
              orientation: null,
              profileDescription: null,
              projectionType: null,
              rating: null,
              state: null,
              timeZone: null,
            },
            type: SyncEntityType.AssetExifV1,
          },
        ]),
      );

      const acks = [initialSyncResponse[0].ack];
      await sut.setAcks(auth, { acks });

      const ackSyncResponse = await testSync(auth, [SyncRequestType.AssetExifsV1]);

      expect(ackSyncResponse).toHaveLength(0);
    });

    it('should only sync asset exif for own user', async () => {
      const { auth, getRepository, testSync } = await setup();

      const userRepo = getRepository('user');
      const user2 = mediumFactory.userInsert();
      await userRepo.create(user2);

      const partnerRepo = getRepository('partner');
      await partnerRepo.create({ sharedById: user2.id, sharedWithId: auth.user.id });

      const assetRepo = getRepository('asset');
      const asset = mediumFactory.assetInsert({ ownerId: user2.id });
      await assetRepo.create(asset);
      await assetRepo.upsertExif({ assetId: asset.id, make: 'Canon' });

      const sessionRepo = getRepository('session');
      const session = mediumFactory.sessionInsert({ userId: user2.id });
      await sessionRepo.create(session);

      const auth2 = factory.auth({ session, user: user2 });
      await expect(testSync(auth2, [SyncRequestType.AssetExifsV1])).resolves.toHaveLength(1);
      await expect(testSync(auth, [SyncRequestType.AssetExifsV1])).resolves.toHaveLength(0);
    });
  });

  describe.concurrent(SyncRequestType.PartnerAssetExifsV1, () => {
    it('should detect and sync the first partner asset exif', async () => {
      const { auth, sut, getRepository, testSync } = await setup();

      const userRepo = getRepository('user');
      const user2 = mediumFactory.userInsert();
      await userRepo.create(user2);

      const partnerRepo = getRepository('partner');
      await partnerRepo.create({ sharedById: user2.id, sharedWithId: auth.user.id });

      const assetRepo = getRepository('asset');
      const asset = mediumFactory.assetInsert({ ownerId: user2.id });
      await assetRepo.create(asset);
      await assetRepo.upsertExif({ assetId: asset.id, make: 'Canon' });

      const initialSyncResponse = await testSync(auth, [SyncRequestType.PartnerAssetExifsV1]);

      expect(initialSyncResponse).toHaveLength(1);
      expect(initialSyncResponse).toEqual(
        expect.arrayContaining([
          {
            ack: expect.any(String),
            data: {
              assetId: asset.id,
              city: null,
              country: null,
              dateTimeOriginal: null,
              description: '',
              exifImageHeight: null,
              exifImageWidth: null,
              exposureTime: null,
              fNumber: null,
              fileSizeInByte: null,
              focalLength: null,
              fps: null,
              iso: null,
              latitude: null,
              lensModel: null,
              longitude: null,
              make: 'Canon',
              model: null,
              modifyDate: null,
              orientation: null,
              profileDescription: null,
              projectionType: null,
              rating: null,
              state: null,
              timeZone: null,
            },
            type: SyncEntityType.PartnerAssetExifV1,
          },
        ]),
      );

      const acks = [initialSyncResponse[0].ack];
      await sut.setAcks(auth, { acks });

      const ackSyncResponse = await testSync(auth, [SyncRequestType.PartnerAssetExifsV1]);

      expect(ackSyncResponse).toHaveLength(0);
    });

    it('should not sync partner asset exif for own user', async () => {
      const { auth, getRepository, testSync } = await setup();

      const userRepo = getRepository('user');
      const user2 = mediumFactory.userInsert();
      await userRepo.create(user2);

      const partnerRepo = getRepository('partner');
      await partnerRepo.create({ sharedById: user2.id, sharedWithId: auth.user.id });

      const assetRepo = getRepository('asset');
      const asset = mediumFactory.assetInsert({ ownerId: auth.user.id });
      await assetRepo.create(asset);
      await assetRepo.upsertExif({ assetId: asset.id, make: 'Canon' });

      await expect(testSync(auth, [SyncRequestType.AssetExifsV1])).resolves.toHaveLength(1);
      await expect(testSync(auth, [SyncRequestType.PartnerAssetExifsV1])).resolves.toHaveLength(0);
    });

    it('should not sync partner asset exif for unrelated user', async () => {
      const { auth, getRepository, testSync } = await setup();

      const userRepo = getRepository('user');

      const user2 = mediumFactory.userInsert();
      const user3 = mediumFactory.userInsert();
      await Promise.all([userRepo.create(user2), userRepo.create(user3)]);

      const partnerRepo = getRepository('partner');
      await partnerRepo.create({ sharedById: user2.id, sharedWithId: auth.user.id });

      const assetRepo = getRepository('asset');
      const asset = mediumFactory.assetInsert({ ownerId: user3.id });
      await assetRepo.create(asset);
      await assetRepo.upsertExif({ assetId: asset.id, make: 'Canon' });

      const sessionRepo = getRepository('session');
      const session = mediumFactory.sessionInsert({ userId: user3.id });
      await sessionRepo.create(session);

      const authUser3 = factory.auth({ session, user: user3 });
      await expect(testSync(authUser3, [SyncRequestType.AssetExifsV1])).resolves.toHaveLength(1);
      await expect(testSync(auth, [SyncRequestType.PartnerAssetExifsV1])).resolves.toHaveLength(0);
    });
  });
});
