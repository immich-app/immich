import { Kysely } from 'kysely';
import { SyncEntityType, SyncRequestType } from 'src/enum';
import { UserRepository } from 'src/repositories/user.repository';
import { DB } from 'src/schema';
import { SyncTestContext } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = async (db?: Kysely<DB>) => {
  const ctx = new SyncTestContext(db || defaultDatabase);
  const { auth, user, session } = await ctx.newSyncAuthUser();
  return { auth, user, session, ctx };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(SyncEntityType.AuthUserV1, () => {
  it('should detect and sync the first user', async () => {
    const { auth, user, ctx } = await setup(await getKyselyDB());

    const response = await ctx.syncStream(auth, [SyncRequestType.AuthUsersV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          id: user.id,
          isAdmin: user.isAdmin,
          deletedAt: user.deletedAt,
          name: user.name,
          avatarColor: user.avatarColor,
          email: user.email,
          pinCode: user.pinCode,
          hasProfileImage: false,
          profileChangedAt: (user.profileChangedAt as Date).toISOString(),
          oauthId: user.oauthId,
          quotaSizeInBytes: user.quotaSizeInBytes,
          quotaUsageInBytes: user.quotaUsageInBytes,
          storageLabel: user.storageLabel,
        },
        type: 'AuthUserV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AuthUsersV1]);
  });

  it('should sync a change and then another change to that same user', async () => {
    const { auth, user, ctx } = await setup(await getKyselyDB());

    const userRepo = ctx.get(UserRepository);

    const response = await ctx.syncStream(auth, [SyncRequestType.AuthUsersV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: user.id,
          isAdmin: false,
        }),
        type: 'AuthUserV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);

    await userRepo.update(user.id, { isAdmin: true });

    const newResponse = await ctx.syncStream(auth, [SyncRequestType.AuthUsersV1]);
    expect(newResponse).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: user.id,
          isAdmin: true,
        }),
        type: 'AuthUserV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });

  it('should only sync the auth user', async () => {
    const { auth, user, ctx } = await setup(await getKyselyDB());

    await ctx.newUser();

    const response = await ctx.syncStream(auth, [SyncRequestType.AuthUsersV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: user.id,
          isAdmin: false,
        }),
        type: 'AuthUserV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });
});
