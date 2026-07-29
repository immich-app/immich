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

  describe('create', () => {
    it('should create a top-level tag with proper closures', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      const result = await sut.create({
        userId: user.id,
        value: 'tagA',
        color: '#000000',
      });

      await expect(
        ctx.database
          .selectFrom('tag')
          .select(['userId', 'value', 'color', 'parentId'])
          .where('id', '=', result.id)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({ userId: user.id, value: 'tagA', color: '#000000', parentId: null });

      await expect(
        ctx.database
          .selectFrom('tag_closure')
          .select(['id_ancestor', 'id_descendant'])
          .where('id_ancestor', '=', result.id)
          .execute(),
      ).resolves.toEqual([{ id_ancestor: result.id, id_descendant: result.id }]);
    });
    it('should create a child tag with proper closures', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      const resultParent = await sut.create({
        userId: user.id,
        value: 'tagA',
        color: '#000000',
      });
      const resultChild = await sut.create({
        userId: user.id,
        value: 'tagA/tagB',
        color: '#00FF00',
        parentId: resultParent.id,
      });

      await expect(
        ctx.database
          .selectFrom('tag')
          .select(['userId', 'value', 'color', 'parentId'])
          .where('id', '=', resultParent.id)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({ userId: user.id, value: 'tagA', color: '#000000', parentId: null });

      await expect(
        ctx.database
          .selectFrom('tag')
          .select(['userId', 'value', 'color', 'parentId'])
          .where('id', '=', resultChild.id)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({ userId: user.id, value: 'tagA/tagB', color: '#00FF00', parentId: resultParent.id });

      await expect(
        ctx.database
          .selectFrom('tag_closure')
          .select(['id_ancestor', 'id_descendant'])
          .where('id_ancestor', '=', resultParent.id)
          .execute(),
      ).resolves.toEqual([
        { id_ancestor: resultParent.id, id_descendant: resultParent.id },
        { id_ancestor: resultParent.id, id_descendant: resultChild.id },
      ]);

      await expect(
        ctx.database
          .selectFrom('tag_closure')
          .select(['id_ancestor', 'id_descendant'])
          .where('id_ancestor', '=', resultChild.id)
          .execute(),
      ).resolves.toEqual([{ id_ancestor: resultChild.id, id_descendant: resultChild.id }]);
    });
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

  describe('delete', () => {
    it('should delete top-level tag without descendants', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      const { tag } = await ctx.newTag({
        userId: user.id,
        value: 'tagA',
        color: '#000000',
      });

      await expect(
        ctx.database
          .selectFrom('tag')
          .select(['userId', 'value', 'color', 'parentId'])
          .where('id', '=', tag.id)
          .executeTakeFirst(),
      ).resolves.toEqual({ userId: user.id, value: 'tagA', color: '#000000', parentId: null });

      await sut.delete(tag.id);

      await expect(
        ctx.database.selectFrom('tag').selectAll().where('id', '=', tag.id).executeTakeFirst(),
      ).resolves.toBeUndefined();
    });

    it('should delete a parent tag and all its descendants', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      const { tag: tag1 } = await ctx.newTag({
        userId: user.id,
        value: 'tagA',
        color: '#000000',
      });

      const { tag: tag2 } = await ctx.newTag({
        userId: user.id,
        value: 'tagA/tagB',
        color: '#00FF00',
        parentId: tag1.id,
      });

      const { tag: tag3 } = await ctx.newTag({
        userId: user.id,
        value: 'tagA/tagB/tagC',
        color: '#0000FF',
        parentId: tag2.id,
      });

      const { tag: tag4 } = await ctx.newTag({
        userId: user.id,
        value: 'tagA/tagD',
        color: '#FFFF00',
        parentId: tag1.id,
      });

      const { tag: tag5 } = await ctx.newTag({
        userId: user.id,
        value: 'tagA/tagD/tagE',
        color: '#FF00FF',
        parentId: tag4.id,
      });
      await expect(
        ctx.database
          .selectFrom('tag')
          .select(['userId', 'value', 'color', 'parentId'])
          .where('id', 'in', [tag1.id, tag2.id, tag3.id, tag4.id, tag5.id])
          .execute(),
      ).resolves.toEqual(
        expect.arrayContaining([
          { userId: user.id, value: 'tagA', color: '#000000', parentId: null },
          { userId: user.id, value: 'tagA/tagB', color: '#00FF00', parentId: tag1.id },
          { userId: user.id, value: 'tagA/tagB/tagC', color: '#0000FF', parentId: tag2.id },
          { userId: user.id, value: 'tagA/tagD', color: '#FFFF00', parentId: tag1.id },
          { userId: user.id, value: 'tagA/tagD/tagE', color: '#FF00FF', parentId: tag4.id },
        ]),
      );

      await sut.delete(tag1.id);

      await expect(
        ctx.database
          .selectFrom('tag')
          .where('id', 'in', [tag1.id, tag2.id, tag3.id, tag4.id, tag5.id])
          .executeTakeFirst(),
      ).resolves.toBeUndefined();
    });

    it('should not delete tags outside the hierarchy', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      const { tag: tag1 } = await ctx.newTag({
        userId: user.id,
        value: 'tagA',
        color: '#000000',
      });

      const { tag: tag2 } = await ctx.newTag({
        userId: user.id,
        value: 'tagA/tagB',
        color: '#00FF00',
        parentId: tag1.id,
      });

      const { tag: tag3 } = await ctx.newTag({
        userId: user.id,
        value: 'tagC',
        color: '#0000FF',
      });

      await expect(
        ctx.database
          .selectFrom('tag')
          .select(['userId', 'value', 'color', 'parentId'])
          .where('id', 'in', [tag1.id, tag2.id, tag3.id])
          .execute(),
      ).resolves.toEqual(
        expect.arrayContaining([
          { userId: user.id, value: 'tagA', color: '#000000', parentId: null },
          { userId: user.id, value: 'tagA/tagB', color: '#00FF00', parentId: tag1.id },
          { userId: user.id, value: 'tagC', color: '#0000FF', parentId: null },
        ]),
      );

      await sut.delete(tag1.id);

      await expect(
        ctx.database.selectFrom('tag').select(['userId', 'value', 'color', 'parentId']).execute(),
      ).resolves.toEqual([{ userId: user.id, value: 'tagC', color: '#0000FF', parentId: null }]);
    });
  });
});
