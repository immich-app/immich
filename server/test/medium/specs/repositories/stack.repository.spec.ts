import { Kysely } from 'kysely';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { StackRepository } from 'src/repositories/stack.repository';
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
  return { ctx, sut: ctx.get(StackRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(StackRepository.name, () => {
  describe('getById', () => {
    it('should return faces for stack assets', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset: primaryAsset } = await ctx.newAsset({ ownerId: user.id });
      const { asset: secondaryAsset } = await ctx.newAsset({ ownerId: user.id });

      await ctx.newExif({ assetId: primaryAsset.id, fileSizeInByte: 123 });
      await ctx.newExif({ assetId: secondaryAsset.id, fileSizeInByte: 456 });

      const { person } = await ctx.newPerson({ ownerId: user.id });
      await ctx.newAssetFace({ assetId: primaryAsset.id, personId: person.id });

      const { result: createdStack } = await ctx.newStack({ ownerId: user.id }, [primaryAsset.id, secondaryAsset.id]);

      const stack = await sut.getById(createdStack.id);

      expect(stack).toBeDefined();
      expect(stack?.assets[0]?.faces).toHaveLength(1);
      expect(stack?.assets[0]?.faces[0]?.person?.id).toBe(person.id);
    });
  });
});
