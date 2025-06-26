import { Kysely } from 'kysely';
import { DB } from 'src/db';
import { SyncEntityType, SyncRequestType } from 'src/enum';
import { UserRepository } from 'src/repositories/user.repository';
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

describe(SyncEntityType.UserV1, () => {
  it('should detect and sync the first user', async () => {
    const { auth, ctx } = await setup(await getKyselyDB());

    const userRepo = ctx.get(UserRepository);
    const user = await userRepo.get(auth.user.id, { withDeleted: false });
    if (!user) {
      expect.fail('First user should exist');
    }

    const response = await ctx.syncStream(auth, [SyncRequestType.UsersV1]);
    expect(response).toHaveLength(1);
    expect(response).toEqual([
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

    await ctx.syncAckAll(auth, response);
    await expect(ctx.syncStream(auth, [SyncRequestType.UsersV1])).resolves.toEqual([]);
  });

  it('should detect and sync a soft deleted user', async () => {
    const { auth, ctx } = await setup(await getKyselyDB());

    const deletedAt = new Date().toISOString();
    const { user: deleted } = await ctx.newUser({ deletedAt });

    const response = await ctx.syncStream(auth, [SyncRequestType.UsersV1]);

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

    await ctx.syncAckAll(auth, response);
    await expect(ctx.syncStream(auth, [SyncRequestType.UsersV1])).resolves.toEqual([]);
  });

  it('should detect and sync a deleted user', async () => {
    const { auth, ctx } = await setup(await getKyselyDB());

    const userRepo = ctx.get(UserRepository);

    const { user } = await ctx.newUser();
    await userRepo.delete({ id: user.id }, true);

    const response = await ctx.syncStream(auth, [SyncRequestType.UsersV1]);
    expect(response).toHaveLength(2);
    expect(response).toEqual([
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
    ]);

    await ctx.syncAckAll(auth, response);
    await expect(ctx.syncStream(auth, [SyncRequestType.UsersV1])).resolves.toEqual([]);
  });

  it('should sync a user and then an update to that same user', async () => {
    const { auth, ctx } = await setup(await getKyselyDB());

    const userRepo = ctx.get(UserRepository);

    const response = await ctx.syncStream(auth, [SyncRequestType.UsersV1]);
    expect(response).toHaveLength(1);
    expect(response).toEqual([
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
    ]);

    await ctx.syncAckAll(auth, response);

    const updated = await userRepo.update(auth.user.id, { name: 'new name' });

    const newResponse = await ctx.syncStream(auth, [SyncRequestType.UsersV1]);
    expect(newResponse).toHaveLength(1);
    expect(newResponse).toEqual([
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
    ]);
  });
});
