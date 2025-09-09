import { Kysely } from 'kysely';
import { SyncEntityType, SyncRequestType } from 'src/enum';
import { PartnerRepository } from 'src/repositories/partner.repository';
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

describe(SyncEntityType.PartnerV1, () => {
  it('should detect and sync the first partner', async () => {
    const { auth, user: user1, ctx } = await setup();

    const { user: user2 } = await ctx.newUser();
    const { partner } = await ctx.newPartner({ sharedById: user2.id, sharedWithId: user1.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.PartnersV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          inTimeline: partner.inTimeline,
          sharedById: partner.sharedById,
          sharedWithId: partner.sharedWithId,
        },
        type: 'PartnerV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnersV1]);
  });

  it('should detect and sync a deleted partner', async () => {
    const { auth, user: user1, ctx } = await setup();

    const partnerRepo = ctx.get(PartnerRepository);

    const { user: user2 } = await ctx.newUser();
    const { partner } = await ctx.newPartner({ sharedById: user2.id, sharedWithId: user1.id });
    await partnerRepo.remove(partner);

    const response = await ctx.syncStream(auth, [SyncRequestType.PartnersV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          sharedById: partner.sharedById,
          sharedWithId: partner.sharedWithId,
        },
        type: 'PartnerDeleteV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnersV1]);
  });

  it('should detect and sync a partner share both to and from another user', async () => {
    const { auth, user: user1, ctx } = await setup();

    const { user: user2 } = await ctx.newUser();
    const { partner: partner1 } = await ctx.newPartner({ sharedById: user2.id, sharedWithId: user1.id });
    const { partner: partner2 } = await ctx.newPartner({ sharedById: user1.id, sharedWithId: user2.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.PartnersV1]);
    expect(response).toEqual([
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
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnersV1]);
  });

  it('should sync a partner and then an update to that same partner', async () => {
    const { auth, user: user1, ctx } = await setup();

    const partnerRepo = ctx.get(PartnerRepository);

    const { user: user2 } = await ctx.newUser();
    const { partner } = await ctx.newPartner({ sharedById: user2.id, sharedWithId: user1.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.PartnersV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          inTimeline: partner.inTimeline,
          sharedById: partner.sharedById,
          sharedWithId: partner.sharedWithId,
        },
        type: 'PartnerV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);

    const updated = await partnerRepo.update(
      { sharedById: partner.sharedById, sharedWithId: partner.sharedWithId },
      { inTimeline: true },
    );

    const newResponse = await ctx.syncStream(auth, [SyncRequestType.PartnersV1]);
    expect(newResponse).toEqual([
      {
        ack: expect.any(String),
        data: {
          inTimeline: updated.inTimeline,
          sharedById: updated.sharedById,
          sharedWithId: updated.sharedWithId,
        },
        type: 'PartnerV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, newResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnersV1]);
  });

  it('should not sync a partner or partner delete for an unrelated user', async () => {
    const { auth, ctx } = await setup();

    const partnerRepo = ctx.get(PartnerRepository);

    const { user: user2 } = await ctx.newUser();
    const { user: user3 } = await ctx.newUser();
    const { partner } = await ctx.newPartner({ sharedById: user2.id, sharedWithId: user3.id });

    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnersV1]);
    await partnerRepo.remove(partner);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnersV1]);
  });

  it('should not sync a partner delete after a user is deleted', async () => {
    const { auth, ctx } = await setup();

    const userRepo = ctx.get(UserRepository);

    const { user: user2 } = await ctx.newUser();
    await ctx.newPartner({ sharedById: user2.id, sharedWithId: auth.user.id });
    await userRepo.delete({ id: user2.id }, true);

    await ctx.assertSyncIsComplete(auth, [SyncRequestType.PartnersV1]);
  });
});
