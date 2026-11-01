import { Kysely } from 'kysely';
import { BulkIdErrorReason } from 'src/dtos/asset-ids.response.dto.js';
import { AssetFileType, AssetVisibility, JobName, JobStatus } from 'src/enum.js';
import { AccessRepository } from 'src/repositories/access.repository.js';
import { AssetRepository } from 'src/repositories/asset.repository.js';
import { EventRepository } from 'src/repositories/event.repository.js';
import { JobRepository } from 'src/repositories/job.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { ResourceRepository } from 'src/repositories/resource.repository.js';
import { TagRepository } from 'src/repositories/tag.repository.js';
import { DB } from 'src/schema/index.js';
import {
  up as migratePrivateTags,
  down as rollbackPrivateTags,
} from 'src/schema/migrations/1795654396199-PrivateTags.js';
import { TagService } from 'src/services/tag.service.js';
import { upsertTags } from 'src/utils/tag.js';
import { newMediumService } from 'test/medium.factory.js';
import { factory, newUuid } from 'test/small.factory.js';
import { getKyselyDB } from 'test/utils.js';

let defaultDatabase: Kysely<DB>;

// eslint-disable-next-line unicorn/no-unnecessary-parameters
const setup = (db?: Kysely<DB>) => {
  return newMediumService(TagService, {
    database: db || defaultDatabase,
    real: [AssetRepository, TagRepository, AccessRepository],
    mock: [ResourceRepository, EventRepository, JobRepository, LoggingRepository],
  });
};

/** A tag owned by one user, plus another user's auth to attempt access with */
const newTagOfAnotherUser = async (ctx: ReturnType<typeof setup>['ctx']) => {
  const { user } = await ctx.newUser();
  const { user: otherUser } = await ctx.newUser();
  const [tag] = await upsertTags(ctx.get(TagRepository), { userId: user.id, tags: ['tag-1'] });

  return { tag, auth: factory.auth({ user }), otherAuth: factory.auth({ user: otherUser }) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(TagService.name, () => {
  describe('get', () => {
    it('should not return a tag of another user', async () => {
      const { sut, ctx } = setup();
      const { tag, otherAuth } = await newTagOfAnotherUser(ctx);

      await expect(sut.get(otherAuth, tag.id)).rejects.toThrow('Not found or no tag.read access');
    });
  });

  describe('update', () => {
    it('should not update a tag of another user', async () => {
      const { sut, ctx } = setup();
      const { tag, otherAuth } = await newTagOfAnotherUser(ctx);

      await expect(sut.update(otherAuth, tag.id, { color: '#000000' })).rejects.toThrow(
        'Not found or no tag.update access',
      );
    });

    it('should sync renamed tags and descendants to the exif table', async () => {
      const { sut, ctx } = setup();
      ctx.getMock(JobRepository).queueAll.mockResolvedValue();
      const { user } = await ctx.newUser();
      const { asset: parentAsset } = await ctx.newAsset({ ownerId: user.id });
      const { asset: childAsset } = await ctx.newAsset({ ownerId: user.id });
      const tagRepo = ctx.get(TagRepository);
      const [parentTag, childTag] = await upsertTags(tagRepo, {
        userId: user.id,
        tags: ['parent', 'parent/child'],
      });
      await ctx.newTagAsset({ tagIds: [parentTag.id], assetIds: [parentAsset.id] });
      await ctx.newTagAsset({ tagIds: [childTag.id], assetIds: [childAsset.id] });
      await ctx.newExif({ assetId: parentAsset.id, tags: ['parent'] });
      await ctx.newExif({ assetId: childAsset.id, tags: ['parent/child'] });

      await sut.update(factory.auth({ user }), parentTag.id, { name: 'renamed' });

      await expect(
        ctx.database
          .selectFrom('asset_exif')
          .select(['assetId', 'lockedProperties', 'tags'])
          .where('assetId', 'in', [parentAsset.id, childAsset.id])
          .orderBy('assetId')
          .execute(),
      ).resolves.toEqual(
        expect.arrayContaining([
          { assetId: parentAsset.id, lockedProperties: ['tags'], tags: ['renamed'] },
          { assetId: childAsset.id, lockedProperties: ['tags'], tags: ['renamed/child'] },
        ]),
      );
      expect(ctx.getMock(JobRepository).queueAll).toHaveBeenCalledWith(
        expect.arrayContaining([
          { name: JobName.SidecarWrite, data: { id: parentAsset.id } },
          { name: JobName.SidecarWrite, data: { id: childAsset.id } },
        ]),
      );
    });
  });

  describe('remove', () => {
    it('should not remove a tag of another user', async () => {
      const { sut, ctx } = setup();
      const { tag, auth, otherAuth } = await newTagOfAnotherUser(ctx);

      await expect(sut.remove(otherAuth, tag.id)).rejects.toThrow('Not found or no tag.delete access');
      await expect(sut.get(auth, tag.id)).resolves.toEqual(expect.objectContaining({ id: tag.id }));
    });
  });

  describe('private tags', () => {
    it('should create one default private locked tag for a new user', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      await sut.onUserCreate(user);
      await sut.onUserCreate(user);

      await expect(sut.getAll(factory.auth({ user }))).resolves.toEqual([]);
      const elevated = factory.auth({ user, session: { hasElevatedPermission: true } });
      await expect(sut.getAll(elevated)).resolves.toEqual([
        expect.objectContaining({ name: 'locked', isPrivate: true }),
      ]);
    });

    it('should migrate legacy locked assets once even if the migration is rerun', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Locked });
      await sut.create(factory.auth({ user }), { name: 'locked' });

      await migratePrivateTags(ctx.database);
      await migratePrivateTags(ctx.database);

      const tag = await ctx.get(TagRepository).getBySystemKey(user.id, 'locked');
      expect(tag).toMatchObject({ isPrivate: true });
      await expect(ctx.get(TagRepository).getAssetIds(tag!.id, [asset.id])).resolves.toEqual(new Set([asset.id]));
      await expect(
        ctx.get(AssetRepository).getStatistics(user.id, { visibility: AssetVisibility.Locked }),
      ).resolves.toMatchObject({ [asset.type]: 1 });
    });

    it('should restore legacy locked visibility for descendants of the system tag on rollback', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await sut.onUserCreate(user);
      const tags = ctx.get(TagRepository);
      const locked = (await tags.getBySystemKey(user.id, 'locked'))!;
      const child = await tags.create({ userId: user.id, parentId: locked.id, value: 'locked/descendant' });
      await ctx.newTagAsset({ tagIds: [child.id], assetIds: [asset.id] });

      const rollback = new Error('Discard the rollback test transaction');
      await expect(
        ctx.database.transaction().execute(async (tx) => {
          await tx.updateTable('tag').set({ isPrivate: false }).where('systemKey', 'is', null).execute();
          await rollbackPrivateTags(tx);
          const restored = await tx
            .selectFrom('asset')
            .select('visibility')
            .where('id', '=', asset.id)
            .executeTakeFirst();
          expect(restored?.visibility).toBe(AssetVisibility.Locked);
          throw rollback;
        }),
      ).rejects.toBe(rollback);
    });

    it('should keep private descendants and their assets when deleting a public parent', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const auth = factory.auth({ user });
      const elevated = factory.auth({ user, session: { hasElevatedPermission: true } });
      const parent = await sut.create(auth, { name: 'public' });
      const child = await sut.create(elevated, { name: 'private', parentId: parent.id, isPrivate: true });
      await ctx.newTagAsset({ tagIds: [child.id], assetIds: [asset.id] });

      await expect(sut.remove(auth, parent.id)).rejects.toThrow('Elevated permission is required');
      await expect(sut.get(elevated, child.id)).resolves.toMatchObject({ isPrivate: true });
    });

    it('should reject upserting a private tag path without elevation', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const elevated = factory.auth({ user, session: { hasElevatedPermission: true } });
      await sut.create(elevated, { name: 'private', isPrivate: true });

      await expect(sut.upsert(factory.auth({ user }), { tags: ['private/new-child'] })).rejects.toThrow('tag.create');
      await expect(sut.getAll(elevated)).resolves.toEqual([expect.objectContaining({ name: 'private' })]);
    });

    it('should hide private tag metadata unless the session is elevated', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const publicTag = await ctx.get(TagRepository).create({ userId: user.id, value: 'public' });
      const privateTag = await ctx.get(TagRepository).create({ userId: user.id, value: 'private', isPrivate: true });
      const auth = factory.auth({ user });
      const elevatedAuth = factory.auth({ user, session: { hasElevatedPermission: true } });

      await expect(sut.getAll(auth)).resolves.toEqual([expect.objectContaining({ id: publicTag.id })]);
      await expect(sut.get(auth, privateTag.id)).rejects.toThrow('Not found or no tag.read access');
      await expect(sut.get(elevatedAuth, privateTag.id)).resolves.toEqual(
        expect.objectContaining({ id: privateTag.id, isPrivate: true }),
      );
    });

    it('should inherit privacy from a private parent tag', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user, session: { hasElevatedPermission: true } });
      const parent = await sut.create(auth, { name: 'private', isPrivate: true });

      const child = await sut.create(auth, { name: 'child', parentId: parent.id, isPrivate: false });

      expect(child).toEqual(expect.objectContaining({ value: 'private/child', isPrivate: false }));
      await expect(sut.get(factory.auth({ user }), child.id)).rejects.toThrow('Not found or no tag.read access');
    });

    it('should require elevated permission to create a private tag', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      await expect(sut.create(auth, { name: 'private', isPrivate: true })).rejects.toThrow(
        'Elevated permission is required',
      );
    });

    it('should hide descendants of private tags unless the session is elevated', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const privateParent = await ctx.get(TagRepository).create({ userId: user.id, value: 'private', isPrivate: true });
      const child = await ctx.get(TagRepository).create({
        userId: user.id,
        value: 'private/child',
        parentId: privateParent.id,
        isPrivate: false,
      });
      const auth = factory.auth({ user });
      const elevatedAuth = factory.auth({ user, session: { hasElevatedPermission: true } });

      await expect(sut.getAll(auth)).resolves.toEqual([]);
      await expect(sut.get(auth, child.id)).rejects.toThrow('Not found or no tag.read access');
      await expect(sut.getAll(elevatedAuth)).resolves.toEqual([
        expect.objectContaining({ id: privateParent.id }),
        expect.objectContaining({ id: child.id }),
      ]);
    });

    it('should inherit privacy while preserving the descendant flag', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user, session: { hasElevatedPermission: true } });
      const [parent, child] = await upsertTags(ctx.get(TagRepository), {
        userId: user.id,
        tags: ['family', 'family/taxes'],
      });

      await expect(sut.update(auth, parent.id, { isPrivate: true })).resolves.toEqual(
        expect.objectContaining({ id: parent.id, isPrivate: true }),
      );

      await expect(ctx.get(TagRepository).get(child.id)).resolves.toMatchObject({ isPrivate: false });
      await expect(sut.get(factory.auth({ user }), child.id)).rejects.toThrow('Not found or no tag.read access');
      await sut.update(auth, parent.id, { isPrivate: false });
      await expect(sut.get(factory.auth({ user }), child.id)).resolves.toMatchObject({ isPrivate: false });
    });

    it('should preserve a private child when the public parent receives an unchanged privacy flag', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const locked = factory.auth({ user });
      const elevated = factory.auth({ user, session: { hasElevatedPermission: true } });
      const parent = await sut.create(locked, { name: 'family' });
      const child = await sut.create(elevated, { name: 'taxes', parentId: parent.id, isPrivate: true });
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newTagAsset({ tagIds: [child.id], assetIds: [asset.id] });

      await sut.update(locked, parent.id, { isPrivate: false });

      await expect(sut.get(elevated, child.id)).resolves.toMatchObject({ isPrivate: true });
      await expect(
        ctx.get(AccessRepository).asset.checkOwnerAccess(user.id, new Set([asset.id]), false),
      ).resolves.toEqual(new Set());
    });

    it('should mark sync for reset even if writing sidecar metadata fails', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { session } = await ctx.newSession({ userId: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const auth = factory.auth({ user, session: { hasElevatedPermission: true } });
      const tag = await sut.create(auth, { name: 'family' });
      await ctx.newTagAsset({ tagIds: [tag.id], assetIds: [asset.id] });
      ctx.getMock(JobRepository).queueAll.mockRejectedValue(new Error('Sidecar queue unavailable'));

      await expect(sut.update(auth, tag.id, { isPrivate: true })).rejects.toThrow('Sidecar queue unavailable');

      await expect(
        ctx.database
          .selectFrom('session')
          .select('isPendingSyncReset')
          .where('id', '=', session.id)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({ isPendingSyncReset: true });
      await expect(sut.get(factory.auth({ user }), tag.id)).rejects.toThrow('Not found or no tag.read access');
    });

    it('should not make a private tag public while it has assets', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const privateTag = await ctx.get(TagRepository).create({ userId: user.id, value: 'private', isPrivate: true });
      await ctx.newTagAsset({ tagIds: [privateTag.id], assetIds: [asset.id] });
      const auth = factory.auth({ user, session: { hasElevatedPermission: true } });

      await expect(sut.update(auth, privateTag.id, { isPrivate: false })).rejects.toThrow(
        'Cannot make a private tag public while it has assets',
      );
    });

    it('should not delete a private tag while it has assets', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const privateTag = await ctx.get(TagRepository).create({ userId: user.id, value: 'private', isPrivate: true });
      await ctx.newTagAsset({ tagIds: [privateTag.id], assetIds: [asset.id] });
      const auth = factory.auth({ user, session: { hasElevatedPermission: true } });

      await expect(sut.remove(auth, privateTag.id)).rejects.toThrow('Cannot delete a private tag while it has assets');
    });

    it('should hide private-tagged assets and files from unelevated owner access checks', async () => {
      const { ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const fileId = newUuid();
      await ctx.newAssetFile({
        id: fileId,
        assetId: asset.id,
        type: AssetFileType.Preview,
        path: 'preview.jpg',
      });
      const privateTag = await ctx.get(TagRepository).create({ userId: user.id, value: 'private', isPrivate: true });
      await ctx.newTagAsset({ tagIds: [privateTag.id], assetIds: [asset.id] });

      await expect(
        ctx.get(AccessRepository).asset.checkOwnerAccess(user.id, new Set([asset.id]), false),
      ).resolves.toEqual(new Set());
      await expect(
        ctx.get(AccessRepository).asset.checkOwnerAccess(user.id, new Set([asset.id]), true),
      ).resolves.toEqual(new Set([asset.id]));
      await expect(
        ctx.get(AccessRepository).assetFile.checkOwnerAccess(user.id, new Set([fileId]), false),
      ).resolves.toEqual(new Set());
      await expect(
        ctx.get(AccessRepository).assetFile.checkOwnerAccess(user.id, new Set([fileId]), true),
      ).resolves.toEqual(new Set([fileId]));
    });
  });

  describe('addAssets', () => {
    it('should not add assets to a tag of another user', async () => {
      const { sut, ctx } = setup();
      const { tag, otherAuth } = await newTagOfAnotherUser(ctx);
      const { asset } = await ctx.newAsset({ ownerId: otherAuth.user.id });

      await expect(sut.addAssets(otherAuth, tag.id, { ids: [asset.id] })).rejects.toThrow(
        'Not found or no tag.asset access',
      );
    });

    it('should lock exif column', async () => {
      const { sut, ctx } = setup();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const [tag] = await upsertTags(ctx.get(TagRepository), { userId: user.id, tags: ['tag-1'] });
      const authDto = factory.auth({ user });

      await sut.addAssets(authDto, tag.id, { ids: [asset.id] });
      await expect(
        ctx.database
          .selectFrom('asset_exif')
          .select(['lockedProperties', 'tags'])
          .where('assetId', '=', asset.id)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({
        lockedProperties: ['tags'],
        tags: ['tag-1'],
      });
      await expect(ctx.get(TagRepository).getByValue(user.id, 'tag-1')).resolves.toEqual(
        expect.objectContaining({ id: tag.id }),
      );
      await expect(ctx.get(TagRepository).getAssetIds(tag.id, [asset.id])).resolves.toContain(asset.id);
    });

    it('should not tag a partner asset', async () => {
      const { sut, ctx } = setup();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      const { user: owner } = await ctx.newUser();
      const { user: partner } = await ctx.newUser();
      await ctx.newPartner({ sharedById: partner.id, sharedWithId: owner.id, inTimeline: true });
      const { asset } = await ctx.newAsset({ ownerId: partner.id });
      const [tag] = await upsertTags(ctx.get(TagRepository), { userId: owner.id, tags: ['tag-1'] });
      const authDto = factory.auth({ user: owner });

      await expect(sut.addAssets(authDto, tag.id, { ids: [asset.id] })).resolves.toEqual([
        { id: asset.id, success: false, error: BulkIdErrorReason.NO_PERMISSION },
      ]);
    });
  });

  describe('removeAssets', () => {
    it('should not remove assets from a tag of another user', async () => {
      const { sut, ctx } = setup();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      const { tag, auth, otherAuth } = await newTagOfAnotherUser(ctx);
      const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
      await sut.addAssets(auth, tag.id, { ids: [asset.id] });

      await expect(sut.removeAssets(otherAuth, tag.id, { ids: [asset.id] })).rejects.toThrow(
        'Not found or no tag.asset access',
      );
      await expect(ctx.get(TagRepository).getAssetIds(tag.id, [asset.id])).resolves.toContain(asset.id);
    });
  });

  describe('deleteEmptyTags', () => {
    it('single tag exists, not connected to any assets, and is deleted', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const tagRepo = ctx.get(TagRepository);
      const [tag] = await upsertTags(tagRepo, { userId: user.id, tags: ['tag-1'] });

      await expect(tagRepo.getByValue(user.id, 'tag-1')).resolves.toEqual(expect.objectContaining({ id: tag.id }));
      await expect(sut.handleTagCleanup()).resolves.toBe(JobStatus.Success);
      await expect(tagRepo.getByValue(user.id, 'tag-1')).resolves.toBeUndefined();
    });

    it('single tag exists, connected to one asset, and is not deleted', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const tagRepo = ctx.get(TagRepository);
      const [tag] = await upsertTags(tagRepo, { userId: user.id, tags: ['tag-1'] });

      await ctx.newTagAsset({ tagIds: [tag.id], assetIds: [asset.id] });

      await expect(tagRepo.getByValue(user.id, 'tag-1')).resolves.toEqual(expect.objectContaining({ id: tag.id }));
      await expect(sut.handleTagCleanup()).resolves.toBe(JobStatus.Success);
      await expect(tagRepo.getByValue(user.id, 'tag-1')).resolves.toEqual(expect.objectContaining({ id: tag.id }));
    });

    it('hierarchical tag exists, and the parent is connected to an asset, and the child is deleted', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const tagRepo = ctx.get(TagRepository);
      const [parentTag, childTag] = await upsertTags(tagRepo, { userId: user.id, tags: ['parent', 'parent/child'] });

      await ctx.newTagAsset({ tagIds: [parentTag.id], assetIds: [asset.id] });

      await expect(tagRepo.getByValue(user.id, 'parent')).resolves.toEqual(
        expect.objectContaining({ id: parentTag.id }),
      );
      await expect(tagRepo.getByValue(user.id, 'parent/child')).resolves.toEqual(
        expect.objectContaining({ id: childTag.id }),
      );
      await expect(sut.handleTagCleanup()).resolves.toBe(JobStatus.Success);
      await expect(tagRepo.getByValue(user.id, 'parent')).resolves.toEqual(
        expect.objectContaining({ id: parentTag.id }),
      );
      await expect(tagRepo.getByValue(user.id, 'parent/child')).resolves.toBeUndefined();
    });

    it('hierarchical tag exists, and only the child is connected to an asset, and nothing is deleted', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const tagRepo = ctx.get(TagRepository);
      const [parentTag, childTag] = await upsertTags(tagRepo, { userId: user.id, tags: ['parent', 'parent/child'] });

      await ctx.newTagAsset({ tagIds: [childTag.id], assetIds: [asset.id] });

      await expect(tagRepo.getByValue(user.id, 'parent')).resolves.toEqual(
        expect.objectContaining({ id: parentTag.id }),
      );
      await expect(tagRepo.getByValue(user.id, 'parent/child')).resolves.toEqual(
        expect.objectContaining({ id: childTag.id }),
      );
      await expect(sut.handleTagCleanup()).resolves.toBe(JobStatus.Success);
      await expect(tagRepo.getByValue(user.id, 'parent')).resolves.toEqual(
        expect.objectContaining({ id: parentTag.id }),
      );
      await expect(tagRepo.getByValue(user.id, 'parent/child')).resolves.toEqual(
        expect.objectContaining({ id: childTag.id }),
      );
    });

    it('hierarchical tag exists, and neither parent nor child is connected to an asset, and both are deleted', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const tagRepo = ctx.get(TagRepository);
      const [parentTag, childTag] = await upsertTags(tagRepo, { userId: user.id, tags: ['parent', 'parent/child'] });

      await expect(tagRepo.getByValue(user.id, 'parent')).resolves.toEqual(
        expect.objectContaining({ id: parentTag.id }),
      );
      await expect(tagRepo.getByValue(user.id, 'parent/child')).resolves.toEqual(
        expect.objectContaining({ id: childTag.id }),
      );
      await expect(sut.handleTagCleanup()).resolves.toBe(JobStatus.Success);
      await expect(tagRepo.getByValue(user.id, 'parent/child')).resolves.toBeUndefined();
      await expect(tagRepo.getByValue(user.id, 'parent')).resolves.toBeUndefined();
    });
  });
});
