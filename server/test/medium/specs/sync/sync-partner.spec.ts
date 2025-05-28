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
