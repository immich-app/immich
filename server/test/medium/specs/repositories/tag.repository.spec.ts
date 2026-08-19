import { Kysely } from 'kysely';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { TagRepository } from 'src/repositories/tag.repository';
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
  return { ctx, sut: ctx.get(TagRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(TagRepository.name, () => {
  afterEach(async () => {
    const { ctx } = setup();
    await ctx.database.deleteFrom('tag_closure').execute();
    await ctx.database.deleteFrom('tag_asset').execute();
    await ctx.database.deleteFrom('tag').execute();
  });

  describe('update', () => {
    it('should update a top-level tag value', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      const { tag } = await ctx.newTag({
        userId: user.id,
        value: 'tagA',
        color: '#000000',
      });

      await sut.update(tag.id, { value: 'updatedTagA' });

      await expect(
        ctx.database
          .selectFrom('tag')
          .select(['userId', 'value', 'color', 'parentId'])
          .where('id', '=', tag.id)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({ userId: user.id, value: 'updatedTagA', color: '#000000', parentId: null });
    });

    it('should update children tag values when parent tag value changes', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      const { tag: parentTag } = await ctx.newTag({
        userId: user.id,
        value: 'tagA',
        color: '#000000',
      });

      const { tag: childTag } = await ctx.newTag({
        userId: user.id,
        value: 'tagA/tagB',
        color: '#00FF00',
        parentId: parentTag.id,
      });

      await sut.update(parentTag.id, { value: 'updatedTagA' });

      await expect(
        ctx.database
          .selectFrom('tag')
          .select(['userId', 'value', 'color', 'parentId'])
          .where('id', '=', parentTag.id)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({ userId: user.id, value: 'updatedTagA', color: '#000000', parentId: null });

      await expect(
        ctx.database
          .selectFrom('tag')
          .select(['userId', 'value', 'color', 'parentId'])
          .where('id', '=', childTag.id)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({ userId: user.id, value: 'updatedTagA/tagB', color: '#00FF00', parentId: parentTag.id });
    });
  });
});
