import { Kysely } from 'kysely';
import { DB } from 'src/db';
import { SyncEntityType, SyncRequestType } from 'src/enum';
import { mediumFactory, newSyncAuthUser, newSyncTest } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = async (db?: Kysely<DB>) => {
  const database = db || defaultDatabase;
  const result = newSyncTest({ db: database });
  const { auth, create } = newSyncAuthUser();
  await create(database);
  return { ...result, auth };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe.concurrent(SyncEntityType.UserV1, () => {
  it('should detect and sync the first user', async () => {
    const { auth, sut, getRepository, testSync } = await setup(await getKyselyDB());

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
          isAdmin: user.isAdmin,
          profileImagePath: user.profileImagePath,
          quotaSizeInBytes: user.quotaSizeInBytes,
          quotaUsageInBytes: user.quotaUsageInBytes,
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
    const { auth, sut, getRepository, testSync } = await setup(await getKyselyDB());

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
            isAdmin: auth.user.isAdmin,
            profileImagePath: auth.user.profileImagePath,
            quotaSizeInBytes: auth.user.quotaSizeInBytes,
            quotaUsageInBytes: auth.user.quotaUsageInBytes,
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
            isAdmin: deleted.isAdmin,
            profileImagePath: deleted.profileImagePath,
            quotaSizeInBytes: deleted.quotaSizeInBytes,
            quotaUsageInBytes: deleted.quotaUsageInBytes,
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
    const { auth, sut, getRepository, testSync } = await setup(await getKyselyDB());

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
            isAdmin: auth.user.isAdmin,
            profileImagePath: auth.user.profileImagePath,
            quotaSizeInBytes: auth.user.quotaSizeInBytes,
            quotaUsageInBytes: auth.user.quotaUsageInBytes,
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
    const { auth, sut, getRepository, testSync } = await setup(await getKyselyDB());

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
            isAdmin: auth.user.isAdmin,
            profileImagePath: auth.user.profileImagePath,
            quotaSizeInBytes: auth.user.quotaSizeInBytes,
            quotaUsageInBytes: auth.user.quotaUsageInBytes,
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
            isAdmin: auth.user.isAdmin,
            profileImagePath: auth.user.profileImagePath,
            quotaSizeInBytes: auth.user.quotaSizeInBytes,
            quotaUsageInBytes: auth.user.quotaUsageInBytes,
          },
          type: 'UserV1',
        },
      ]),
    );
  });
});
