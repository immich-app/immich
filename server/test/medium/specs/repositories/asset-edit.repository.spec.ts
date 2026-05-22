import { Kysely } from 'kysely';
import { AssetEditAction, MirrorAxis } from 'src/dtos/editing.dto';
import { AssetEditRepository } from 'src/repositories/asset-edit.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const { ctx } = newMediumService(BaseService, {
    database: db || defaultDatabase,
    real: [],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(AssetEditRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(AssetEditRepository.name, () => {
  describe('replaceAll', () => {
    it('should set isEdited on insert', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      await expect(
        ctx.database.selectFrom('asset').select('isEdited').where('id', '=', asset.id).executeTakeFirstOrThrow(),
      ).resolves.toEqual({ isEdited: false });

      await sut.replaceAll(asset.id, [
        { action: AssetEditAction.Crop, parameters: { height: 1, width: 1, x: 1, y: 1 } },
      ]);

      await expect(
        ctx.database.selectFrom('asset').select('isEdited').where('id', '=', asset.id).executeTakeFirstOrThrow(),
      ).resolves.toEqual({ isEdited: true });
    });

    it('should set isEdited when inserting multiple edits', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      await expect(
        ctx.database.selectFrom('asset').select('isEdited').where('id', '=', asset.id).executeTakeFirstOrThrow(),
      ).resolves.toEqual({ isEdited: false });

      await sut.replaceAll(asset.id, [
        { action: AssetEditAction.Crop, parameters: { height: 1, width: 1, x: 1, y: 1 } },
        { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
        { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
      ]);

      await expect(
        ctx.database.selectFrom('asset').select('isEdited').where('id', '=', asset.id).executeTakeFirstOrThrow(),
      ).resolves.toEqual({ isEdited: true });
    });

    it('should keep isEdited when removing some edits', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      await expect(
        ctx.database.selectFrom('asset').select('isEdited').where('id', '=', asset.id).executeTakeFirstOrThrow(),
      ).resolves.toEqual({ isEdited: false });

      await sut.replaceAll(asset.id, [
        { action: AssetEditAction.Crop, parameters: { height: 1, width: 1, x: 1, y: 1 } },
        { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
        { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
      ]);

      await expect(
        ctx.database.selectFrom('asset').select('isEdited').where('id', '=', asset.id).executeTakeFirstOrThrow(),
      ).resolves.toEqual({ isEdited: true });

      await sut.replaceAll(asset.id, [
        { action: AssetEditAction.Crop, parameters: { height: 1, width: 1, x: 1, y: 1 } },
      ]);

      await expect(
        ctx.database.selectFrom('asset').select('isEdited').where('id', '=', asset.id).executeTakeFirstOrThrow(),
      ).resolves.toEqual({ isEdited: true });
    });

    it('should set isEdited to false if all edits are deleted', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      await expect(
        ctx.database.selectFrom('asset').select('isEdited').where('id', '=', asset.id).executeTakeFirstOrThrow(),
      ).resolves.toEqual({ isEdited: false });

      await sut.replaceAll(asset.id, [
        { action: AssetEditAction.Crop, parameters: { height: 1, width: 1, x: 1, y: 1 } },
        { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
        { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
      ]);

      await sut.replaceAll(asset.id, []);

      await expect(
        ctx.database.selectFrom('asset').select('isEdited').where('id', '=', asset.id).executeTakeFirstOrThrow(),
      ).resolves.toEqual({ isEdited: false });
    });
  });
});
