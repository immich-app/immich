import { Kysely } from 'kysely';
import { DB } from 'src/db';
import { AssetRepository } from 'src/repositories/asset.repository';
import { PartnerRepository } from 'src/repositories/partner.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { partners_delete_audit } from 'src/schema/functions';
import { mediumFactory } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

describe('audit', () => {
  let defaultDatabase: Kysely<DB>;
  let assetRepo: AssetRepository;
  let userRepo: UserRepository;
  let partnerRepo: PartnerRepository;

  beforeAll(async () => {
    defaultDatabase = await getKyselyDB();

    assetRepo = new AssetRepository(defaultDatabase);
    userRepo = new UserRepository(defaultDatabase);
    partnerRepo = new PartnerRepository(defaultDatabase);
  });

  describe(partners_delete_audit.name, () => {
    it('should not cascade user deletes to partners_audit', async () => {
      const user1 = mediumFactory.userInsert();
      const user2 = mediumFactory.userInsert();

      await Promise.all([userRepo.create(user1), userRepo.create(user2)]);
      await partnerRepo.create({ sharedById: user1.id, sharedWithId: user2.id });
      await userRepo.delete(user1, true);

      await expect(
        defaultDatabase.selectFrom('partners_audit').select(['id']).where('sharedById', '=', user1.id).execute(),
      ).resolves.toHaveLength(0);
    });
  });

  describe('assets_audit', () => {
    it('should not cascade user deletes to assets_audit', async () => {
      const user = mediumFactory.userInsert();
      const asset = mediumFactory.assetInsert({ ownerId: user.id });

      await userRepo.create(user);
      await assetRepo.create(asset);
      await userRepo.delete(user, true);

      await expect(
        defaultDatabase.selectFrom('assets_audit').select(['id']).where('assetId', '=', asset.id).execute(),
      ).resolves.toHaveLength(0);
    });
  });

  describe('exif', () => {
    it('should automatically set updatedAt and updateId when the row is updated', async () => {
      const user = mediumFactory.userInsert();
      const asset = mediumFactory.assetInsert({ ownerId: user.id });

      await userRepo.create(user);
      await assetRepo.create(asset);
      await assetRepo.upsertExif({ assetId: asset.id, make: 'Canon' });

      const before = await defaultDatabase
        .selectFrom('exif')
        .select(['updatedAt', 'updateId'])
        .where('assetId', '=', asset.id)
        .executeTakeFirstOrThrow();

      await assetRepo.upsertExif({ assetId: asset.id, make: 'Canon 2' });

      const after = await defaultDatabase
        .selectFrom('exif')
        .select(['updatedAt', 'updateId'])
        .where('assetId', '=', asset.id)
        .executeTakeFirstOrThrow();

      expect(before.updateId).not.toEqual(after.updateId);
      expect(before.updatedAt).not.toEqual(after.updatedAt);
    });
  });
});
