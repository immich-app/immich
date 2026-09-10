import { Kysely } from 'kysely';
import { AccessRepository } from 'src/repositories/access.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PartnerDirection, PartnerRepository } from 'src/repositories/partner.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { DB } from 'src/schema';
import { PartnerService } from 'src/services/partner.service';
import { newMediumService } from 'test/medium.factory';
import { factory, newUuid } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(PartnerService, {
    database: db || defaultDatabase,
    real: [AccessRepository, PartnerRepository, UserRepository],
    mock: [LoggingRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(PartnerService.name, () => {
  describe('create', () => {
    it('should share with a new partner', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { user: partner } = await ctx.newUser();

      await expect(sut.create(factory.auth({ user }), { sharedWithId: partner.id })).resolves.toEqual(
        expect.objectContaining({ id: partner.id }),
      );
    });

    it('should not share with a partner that is already shared with', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { user: partner } = await ctx.newUser();
      await ctx.newPartner({ sharedById: user.id, sharedWithId: partner.id });

      await expect(sut.create(factory.auth({ user }), { sharedWithId: partner.id })).rejects.toThrow(
        'Partner already exists',
      );
    });

    it('should not share with an unknown user', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();

      await expect(sut.create(factory.auth({ user }), { sharedWithId: newUuid() })).rejects.toThrow('Invalid user');
    });
  });

  describe('search', () => {
    it('should return partners shared by the user', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { user: partner } = await ctx.newUser();
      await ctx.newPartner({ sharedById: user.id, sharedWithId: partner.id });

      await expect(sut.search(factory.auth({ user }), { direction: PartnerDirection.SharedBy })).resolves.toEqual([
        expect.objectContaining({ id: partner.id }),
      ]);
    });

    it('should return partners that share with the user', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { user: partner } = await ctx.newUser();
      await ctx.newPartner({ sharedById: partner.id, sharedWithId: user.id });

      await expect(sut.search(factory.auth({ user }), { direction: PartnerDirection.SharedWith })).resolves.toEqual([
        expect.objectContaining({ id: partner.id }),
      ]);
    });
  });

  describe('update', () => {
    it('should update a partner', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { user: partner } = await ctx.newUser();
      await ctx.newPartner({ sharedById: partner.id, sharedWithId: user.id });

      await expect(sut.update(factory.auth({ user }), partner.id, { inTimeline: false })).resolves.toEqual(
        expect.objectContaining({ id: partner.id, inTimeline: false }),
      );
    });

    it('should not update a partner that did not share with the user', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { user: partner } = await ctx.newUser();
      const { user: other } = await ctx.newUser();
      await ctx.newPartner({ sharedById: partner.id, sharedWithId: other.id });

      await expect(sut.update(factory.auth({ user }), partner.id, { inTimeline: false })).rejects.toThrow(
        'Not found or no partner.update access',
      );
    });
  });

  describe('remove', () => {
    it('should remove a partner', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { user: partner } = await ctx.newUser();
      await ctx.newPartner({ sharedById: user.id, sharedWithId: partner.id });

      await expect(sut.remove(factory.auth({ user }), partner.id)).resolves.toBeUndefined();
      await expect(sut.search(factory.auth({ user }), { direction: PartnerDirection.SharedBy })).resolves.toEqual([]);
    });

    it('should throw when the partner does not exist', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();

      await expect(sut.remove(factory.auth({ user }), newUuid())).rejects.toThrow('Partner not found');
    });
  });
});
