import { AssetEditAction } from 'src/dtos/editing.dto';
import { AssetEditRepository } from 'src/repositories/asset-edit.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PartnerRepository } from 'src/repositories/partner.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { partner_delete_audit, stack_delete_audit } from 'src/schema/functions';
import { BaseService } from 'src/services/base.service';
import { MediumTestContext } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

describe('audit', () => {
  let ctx: MediumTestContext;

  beforeAll(async () => {
    ctx = new MediumTestContext(BaseService, {
      database: await getKyselyDB(),
      real: [],
      mock: [LoggingRepository],
    });
  });

  describe(partner_delete_audit.name, () => {
    it('should not cascade user deletes to partners_audit', async () => {
      const partnerRepo = ctx.get(PartnerRepository);
      const userRepo = ctx.get(UserRepository);
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();
      await partnerRepo.create({ sharedById: user1.id, sharedWithId: user2.id });
      await userRepo.delete(user1, true);
      await expect(
        ctx.database.selectFrom('partner_audit').select(['id']).where('sharedById', '=', user1.id).execute(),
      ).resolves.toHaveLength(0);
    });
  });

  describe(stack_delete_audit.name, () => {
    it('should not cascade user deletes to stacks_audit', async () => {
      const userRepo = ctx.get(UserRepository);
      const { user } = await ctx.newUser();
      const { asset: asset1 } = await ctx.newAsset({ ownerId: user.id });
      const { asset: asset2 } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newStack({ ownerId: user.id }, [asset1.id, asset2.id]);
      await userRepo.delete(user, true);
      await expect(
        ctx.database.selectFrom('stack_audit').select(['id']).where('userId', '=', user.id).execute(),
      ).resolves.toHaveLength(0);
    });
  });

  describe('asset_edit_audit', () => {
    it('should not cascade asset deletes to asset_edit_audit', async () => {
      const assetEditRepo = ctx.get(AssetEditRepository);
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      await assetEditRepo.replaceAll(asset.id, [
        {
          action: AssetEditAction.Crop,
          parameters: { x: 10, y: 20, width: 100, height: 200 },
        },
      ]);

      await ctx.database.deleteFrom('asset').where('id', '=', asset.id).execute();

      await expect(
        ctx.database.selectFrom('asset_edit_audit').select(['id']).where('assetId', '=', asset.id).execute(),
      ).resolves.toHaveLength(0);
    });
  });

  describe('assets_audit', () => {
    it('should not cascade user deletes to assets_audit', async () => {
      const userRepo = ctx.get(UserRepository);
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await userRepo.delete(user, true);
      await expect(
        ctx.database.selectFrom('asset_audit').select(['id']).where('assetId', '=', asset.id).execute(),
      ).resolves.toHaveLength(0);
    });
  });

  describe('exif', () => {
    it('should automatically set updatedAt and updateId when the row is updated', async () => {
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({ assetId: asset.id, make: 'Canon' });

      const before = await ctx.database
        .selectFrom('asset_exif')
        .select(['updatedAt', 'updateId'])
        .where('assetId', '=', asset.id)
        .executeTakeFirstOrThrow();

      await ctx.newExif({ assetId: asset.id, make: 'Canon 2' });

      const after = await ctx.database
        .selectFrom('asset_exif')
        .select(['updatedAt', 'updateId'])
        .where('assetId', '=', asset.id)
        .executeTakeFirstOrThrow();

      expect(before.updateId).not.toEqual(after.updateId);
      expect(before.updatedAt).not.toEqual(after.updatedAt);
    });
  });
});
