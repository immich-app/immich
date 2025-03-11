import { TestContext, TestFactory } from 'test/factory';
import { getKyselyDB } from 'test/utils';

describe('audit', () => {
  let context: TestContext;

  beforeAll(async () => {
    const db = await getKyselyDB();
    context = await TestContext.from(db).create();
  });

  describe('partners_audit', () => {
    it('should not cascade user deletes to partners_audit', async () => {
      const user1 = TestFactory.user();
      const user2 = TestFactory.user();

      await context
        .getFactory()
        .withUser(user1)
        .withUser(user2)
        .withPartner({ sharedById: user1.id, sharedWithId: user2.id })
        .create();

      await context.user.delete(user1, true);

      await expect(
        context.db.selectFrom('partners_audit').select(['id']).where('sharedById', '=', user1.id).execute(),
      ).resolves.toHaveLength(0);
    });
  });

  describe('assets_audit', () => {
    it('should not cascade user deletes to assets_audit', async () => {
      const user = TestFactory.user();
      const asset = TestFactory.asset({ ownerId: user.id });

      await context.getFactory().withUser(user).withAsset(asset).create();

      await context.user.delete(user, true);

      await expect(
        context.db.selectFrom('assets_audit').select(['id']).where('assetId', '=', asset.id).execute(),
      ).resolves.toHaveLength(0);
    });
  });

  describe('exif', () => {
    it('should automatically set updatedAt and updateId when the row is updated', async () => {
      const user = TestFactory.user();
      const asset = TestFactory.asset({ ownerId: user.id });
      const exif = { assetId: asset.id, make: 'Canon' };

      await context.getFactory().withUser(user).withAsset(asset).create();
      await context.asset.upsertExif(exif);

      const before = await context.db
        .selectFrom('exif')
        .select(['updatedAt', 'updateId'])
        .where('assetId', '=', asset.id)
        .executeTakeFirstOrThrow();

      await context.asset.upsertExif({ assetId: asset.id, make: 'Canon 2' });

      const after = await context.db
        .selectFrom('exif')
        .select(['updatedAt', 'updateId'])
        .where('assetId', '=', asset.id)
        .executeTakeFirstOrThrow();

      expect(before.updateId).not.toEqual(after.updateId);
      expect(before.updatedAt).not.toEqual(after.updatedAt);
    });
  });
});
