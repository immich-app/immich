import { Kysely } from 'kysely';
import { SyncEntityType, SyncRequestType } from 'src/enum';
import { PersonRepository } from 'src/repositories/person.repository';
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

describe(SyncEntityType.PersonV2, () => {
  it('should detect and sync the first person', async () => {
    const { auth, ctx } = await setup();
    const { person } = await ctx.newPerson({ trustedGroupId: auth.user.trustedGroupId });

    const response = await ctx.syncStream(auth, [SyncRequestType.PeopleV2]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: person.id,
          name: person.name,
          birthDate: person.birthDate,
          trustedGroupId: auth.user.trustedGroupId,
          color: person.color,
        }),
        type: 'PersonV2',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PeopleV2]);
  });

  it('should detect and sync a deleted person', async () => {
    const { auth, ctx } = await setup();
    const personRepo = ctx.get(PersonRepository);
    const { person } = await ctx.newPerson({ trustedGroupId: auth.user.trustedGroupId });
    await personRepo.delete([person.id]);

    const response = await ctx.syncStream(auth, [SyncRequestType.PeopleV2]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          personId: person.id,
        },
        type: 'PersonDeleteV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PeopleV2]);
  });

  it('should not sync a person or person delete for an unrelated user', async () => {
    const { auth, ctx } = await setup();
    const personRepo = ctx.get(PersonRepository);
    const { user: user2 } = await ctx.newUser();
    const { session } = await ctx.newSession({ userId: user2.id });
    const { person } = await ctx.newPerson({ trustedGroupId: user2.trustedGroupId });
    const auth2 = factory.auth({ session, user: user2 });

    expect(await ctx.syncStream(auth2, [SyncRequestType.PeopleV2])).toEqual([
      expect.objectContaining({ type: SyncEntityType.PersonV2 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PeopleV1]);

    await personRepo.delete([person.id]);

    expect(await ctx.syncStream(auth2, [SyncRequestType.PeopleV2])).toEqual([
      expect.objectContaining({ type: SyncEntityType.PersonDeleteV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PeopleV2]);
  });
});

describe(SyncEntityType.PersonV1, () => {
  it('should detect and sync the first person', async () => {
    const { auth, ctx } = await setup();
    const { person } = await ctx.newPerson({ trustedGroupId: auth.user.trustedGroupId });
    const { personUser } = await ctx.newPersonUser({ personId: person.id, ownerId: auth.user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.PeopleV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: person.id,
          name: person.name,
          isHidden: personUser.isHidden,
          birthDate: person.birthDate,
          faceAssetId: personUser.thumbnailFaceAssetId,
          isFavorite: personUser.isFavorite,
          ownerId: auth.user.id,
          color: person.color,
        }),
        type: 'PersonV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PeopleV1]);
  });

  it('should detect and sync a deleted person', async () => {
    const { auth, ctx } = await setup();
    const personRepo = ctx.get(PersonRepository);
    const { person } = await ctx.newPerson({ trustedGroupId: auth.user.trustedGroupId });
    await personRepo.delete([person.id]);

    const response = await ctx.syncStream(auth, [SyncRequestType.PeopleV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          personId: person.id,
        },
        type: 'PersonDeleteV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PeopleV1]);
  });

  it('should not sync a person or person delete for an unrelated user', async () => {
    const { auth, ctx } = await setup();
    const personRepo = ctx.get(PersonRepository);
    const { user: user2 } = await ctx.newUser();
    const { session } = await ctx.newSession({ userId: user2.id });
    const { person } = await ctx.newPerson({ trustedGroupId: user2.trustedGroupId });
    await ctx.newPersonUser({ personId: person.id, ownerId: user2.id });
    const auth2 = factory.auth({ session, user: user2 });

    expect(await ctx.syncStream(auth2, [SyncRequestType.PeopleV1])).toEqual([
      expect.objectContaining({ type: SyncEntityType.PersonV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PeopleV1]);

    await personRepo.delete([person.id]);

    expect(await ctx.syncStream(auth2, [SyncRequestType.PeopleV1])).toEqual([
      expect.objectContaining({ type: SyncEntityType.PersonDeleteV1 }),
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PeopleV1]);
  });
});
