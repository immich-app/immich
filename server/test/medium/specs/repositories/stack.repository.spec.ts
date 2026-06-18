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
    real: [StackRepository],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(StackRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

const stackIdOf = async (assetId: string) => {
  const row = await defaultDatabase.selectFrom('asset').select('stackId').where('id', '=', assetId).executeTakeFirst();
  return row?.stackId ?? null;
};

describe(StackRepository.name, () => {
  describe('linkAsset', () => {
    it('promotes the new asset to primary by default (edit-pair semantics)', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset: parent } = await ctx.newAsset({ ownerId: user.id });
      const { asset: edit } = await ctx.newAsset({ ownerId: user.id });

      const result = await sut.linkAsset(user.id, edit.id, parent.id);

      expect(result).toEqual({ stackId: expect.any(String), created: true });
      const stack = await sut.getById(result!.stackId);
      expect(stack!.primaryAssetId).toBe(edit.id);
      expect(await stackIdOf(parent.id)).toBe(result!.stackId);
      expect(await stackIdOf(edit.id)).toBe(result!.stackId);
    });

    it('keeps the parent as primary when keepPrimary is set (burst frame)', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset: rep } = await ctx.newAsset({ ownerId: user.id });
      const { asset: member } = await ctx.newAsset({ ownerId: user.id });

      const result = await sut.linkAsset(user.id, member.id, rep.id, true);

      expect(result).toEqual({ stackId: expect.any(String), created: true });
      const stack = await sut.getById(result!.stackId);
      expect(stack!.primaryAssetId).toBe(rep.id);
      expect(await stackIdOf(rep.id)).toBe(result!.stackId);
      expect(await stackIdOf(member.id)).toBe(result!.stackId);
    });

    it('joins an existing stack and keeps its primary when keepPrimary is set', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset: rep } = await ctx.newAsset({ ownerId: user.id });
      const { asset: member1 } = await ctx.newAsset({ ownerId: user.id });
      const { asset: member2 } = await ctx.newAsset({ ownerId: user.id });

      const first = await sut.linkAsset(user.id, member1.id, rep.id, true);
      const second = await sut.linkAsset(user.id, member2.id, rep.id, true);

      expect(second).toEqual({ stackId: first!.stackId, created: false });
      const stack = await sut.getById(first!.stackId);
      expect(stack!.primaryAssetId).toBe(rep.id);
      for (const id of [rep.id, member1.id, member2.id]) {
        expect(await stackIdOf(id)).toBe(first!.stackId);
      }
    });

    it('promotes the newcomer when joining an existing stack without keepPrimary', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset: rep } = await ctx.newAsset({ ownerId: user.id });
      const { asset: member } = await ctx.newAsset({ ownerId: user.id });
      const { asset: edit } = await ctx.newAsset({ ownerId: user.id });

      const first = await sut.linkAsset(user.id, member.id, rep.id, true);
      const second = await sut.linkAsset(user.id, edit.id, rep.id);

      expect(second).toEqual({ stackId: first!.stackId, created: false });
      const stack = await sut.getById(first!.stackId);
      expect(stack!.primaryAssetId).toBe(edit.id);
    });

    it('returns null when the parent is gone', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset: member } = await ctx.newAsset({ ownerId: user.id });

      const result = await sut.linkAsset(user.id, member.id, '00000000-0000-4000-8000-000000000000');

      expect(result).toBeNull();
    });

    it('returns null when the parent belongs to another owner', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: other } = await ctx.newUser();
      const { asset: parent } = await ctx.newAsset({ ownerId: other.id });
      const { asset: member } = await ctx.newAsset({ ownerId: owner.id });

      const result = await sut.linkAsset(owner.id, member.id, parent.id, true);

      expect(result).toBeNull();
    });

    it('returns null when the asset being linked is trashed (duplicate re-upload)', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset: parent } = await ctx.newAsset({ ownerId: user.id });
      const { asset: trashed } = await ctx.newAsset({ ownerId: user.id, deletedAt: new Date() });

      const result = await sut.linkAsset(user.id, trashed.id, parent.id);

      expect(result).toBeNull();
      // the parent stays unstacked rather than getting a trashed cover
      expect(await stackIdOf(parent.id)).toBeNull();
    });

    it('returns null (not a 500) when the new asset is already another stack primary', async () => {
      // A retried upload can try to link an asset that is already a stack primary;
      // the unique-primary constraint must surface as "couldn't stack", not a 500.
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset: parentA } = await ctx.newAsset({ ownerId: user.id });
      const { asset: x } = await ctx.newAsset({ ownerId: user.id });
      const { asset: parentB } = await ctx.newAsset({ ownerId: user.id });

      // x becomes the primary of its own stack
      const first = await sut.linkAsset(user.id, x.id, parentA.id);
      expect(first).not.toBeNull();

      // now try to link x onto a different parent → would need x as a second
      // stack's primary → unique-constraint hit → caught → null
      const second = await sut.linkAsset(user.id, x.id, parentB.id);
      expect(second).toBeNull();
    });
  });
});
