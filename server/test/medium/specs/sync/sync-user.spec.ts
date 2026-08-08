import { Kysely } from 'kysely';
import { SyncEntityType, SyncRequestType } from 'src/enum';
import { UserRepository } from 'src/repositories/user.repository';
import { DB } from 'src/schema';
import { SyncTestContext } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = async (db?: Kysely<DB>) => {
  const ctx = new SyncTestContext(db || defaultDatabase);
  const { auth, user, session } = await ctx.newSyncAuthUser();
  return { auth, user, session, ctx };
};

const disablePublicUsers = async (ctx: SyncTestContext) => {
  const config = await ctx.sut.getConfig({ withCache: false });
  config.server.publicUsers = false;
  await ctx.sut.updateConfig(config);
};

const getSyncedUserIds = (response: Array<{ type: string; data: any }>) =>
  response.filter((item) => item.type === SyncEntityType.UserV1).map((item) => item.data.id);

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
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          deletedAt: user.deletedAt,
          email: user.email,
          hasProfileImage: user.profileImagePath !== '',
          id: user.id,
          name: user.name,
          avatarColor: user.avatarColor,
          profileChangedAt: user.profileChangedAt.toISOString(),
        },
        type: 'UserV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.UsersV1]);
  });

  it('should detect and sync a soft deleted user', async () => {
    const { auth, ctx } = await setup(await getKyselyDB());

    const { user: deleted } = await ctx.newUser({ deletedAt: new Date().toISOString() });

    const response = await ctx.syncStream(auth, [SyncRequestType.UsersV1]);

    expect(response).toEqual(
      expect.arrayContaining([
        {
          ack: expect.any(String),
          data: expect.objectContaining({ id: auth.user.id }),
          type: 'UserV1',
        },
        {
          ack: expect.any(String),
          data: expect.objectContaining({ id: deleted.id }),
          type: 'UserV1',
        },
        expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
      ]),
    );

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.UsersV1]);
  });

  it('should detect and sync a deleted user', async () => {
    const { auth, user: authUser, ctx } = await setup(await getKyselyDB());

    const userRepo = ctx.get(UserRepository);

    const { user } = await ctx.newUser();
    await userRepo.delete({ id: user.id }, true);

    const response = await ctx.syncStream(auth, [SyncRequestType.UsersV1]);
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
        data: expect.objectContaining({ id: authUser.id }),
        type: 'UserV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.UsersV1]);
  });

  it('should sync a user and then an update to that same user', async () => {
    const { auth, user, ctx } = await setup(await getKyselyDB());

    const userRepo = ctx.get(UserRepository);

    const response = await ctx.syncStream(auth, [SyncRequestType.UsersV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({ id: user.id }),
        type: 'UserV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);

    const updated = await userRepo.update(auth.user.id, { name: 'new name' });

    const newResponse = await ctx.syncStream(auth, [SyncRequestType.UsersV1]);
    expect(newResponse).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({ id: user.id, name: updated.name }),
        type: 'UserV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });

  describe('public users disabled', () => {
    it('should only sync the authenticated user when there are no relationships', async () => {
      const { auth, ctx } = await setup(await getKyselyDB());
      await disablePublicUsers(ctx);

      const { user: unrelated } = await ctx.newUser();

      const response = await ctx.syncStream(auth, [SyncRequestType.UsersV1]);
      const ids = getSyncedUserIds(response);

      expect(ids).toEqual([auth.user.id]);
      expect(ids).not.toContain(unrelated.id);
    });

    it('should sync partners', async () => {
      const { auth, ctx } = await setup(await getKyselyDB());
      await disablePublicUsers(ctx);

      const { user: partner } = await ctx.newUser();
      await ctx.newPartner({ sharedById: auth.user.id, sharedWithId: partner.id });
      const { user: unrelated } = await ctx.newUser();

      const response = await ctx.syncStream(auth, [SyncRequestType.UsersV1]);
      const ids = getSyncedUserIds(response);

      expect(ids).toEqual(expect.arrayContaining([auth.user.id, partner.id]));
      expect(ids).not.toContain(unrelated.id);
    });

    it('should sync album co-members', async () => {
      const { auth, ctx } = await setup(await getKyselyDB());
      await disablePublicUsers(ctx);

      const { user: coMember } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: auth.user.id });
      await ctx.newAlbumUser({ albumId: album.id, userId: coMember.id });
      const { user: unrelated } = await ctx.newUser();

      const response = await ctx.syncStream(auth, [SyncRequestType.UsersV1]);
      const ids = getSyncedUserIds(response);

      expect(ids).toEqual(expect.arrayContaining([auth.user.id, coMember.id]));
      expect(ids).not.toContain(unrelated.id);
    });

    it('should still sync all users for an admin', async () => {
      const { ctx } = await setup(await getKyselyDB());
      await disablePublicUsers(ctx);

      const { user: admin } = await ctx.newUser({ isAdmin: true });
      const { session: adminSession } = await ctx.newSession({ userId: admin.id });
      const adminAuth = factory.auth({
        session: adminSession,
        user: { id: admin.id, name: admin.name, email: admin.email, isAdmin: true },
      });
      const { user: unrelated } = await ctx.newUser();

      const response = await ctx.syncStream(adminAuth, [SyncRequestType.UsersV1]);
      const ids = getSyncedUserIds(response);

      expect(ids).toEqual(expect.arrayContaining([admin.id, unrelated.id]));
    });
  });
});
