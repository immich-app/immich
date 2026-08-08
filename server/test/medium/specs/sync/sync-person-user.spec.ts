import { Kysely } from 'kysely';
import { SyncEntityType, SyncRequestType } from 'src/enum';
import { PersonUserRepository } from 'src/repositories/person-user.repository';
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

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(SyncEntityType.PersonUserV1, () => {
  it('should detect and sync the first person user', async () => {
    const { auth, ctx } = await setup();
    const { person } = await ctx.newPerson({ trustedGroupId: auth.user.trustedGroupId });
    const { personUser } = await ctx.newPersonUser({ personId: person.id, ownerId: auth.user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.PersonUsersV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          personId: person.id,
          ownerId: auth.user.id,
          isHidden: personUser.isHidden,
          isFavorite: personUser.isFavorite,
          thumbnailFaceAssetId: personUser.thumbnailFaceAssetId,
        }),
        type: 'PersonUserV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PersonUsersV1]);
  });

  it('should detect and sync a deleted person user', async () => {
    const { auth, ctx } = await setup();
    const personUserRepo = ctx.get(PersonUserRepository);
    const { person } = await ctx.newPerson({ trustedGroupId: auth.user.trustedGroupId });
    await ctx.newPersonUser({ personId: person.id, ownerId: auth.user.id });
    await personUserRepo.delete({ personId: person.id, ownerId: auth.user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.PersonUsersV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          personId: person.id,
          ownerId: auth.user.id,
        },
        type: 'PersonUserDeleteV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PersonUsersV1]);
  });

  it('should not sync a personUser or personUser delete for an unrelated user', async () => {
    const { auth, ctx } = await setup();
    const personUserRepo = ctx.get(PersonUserRepository);
    const { user: user2 } = await ctx.newUser();
    const { session } = await ctx.newSession({ userId: user2.id });
    const { person } = await ctx.newPerson({ trustedGroupId: user2.trustedGroupId });
    await ctx.newPersonUser({ personId: person.id, ownerId: user2.id });
    const auth2 = factory.auth({ session, user: user2 });

    expect(await ctx.syncStream(auth2, [SyncRequestType.PersonUsersV1])).toEqual([
      expect.objectContaining({ type: SyncEntityType.PersonUserV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PersonUsersV1]);

    await personUserRepo.delete({ personId: person.id, ownerId: user2.id });

    expect(await ctx.syncStream(auth2, [SyncRequestType.PersonUsersV1])).toEqual([
      expect.objectContaining({ type: SyncEntityType.PersonUserDeleteV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PersonUsersV1]);
  });
});
