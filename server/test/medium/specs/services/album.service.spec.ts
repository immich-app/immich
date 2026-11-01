import { Kysely } from 'kysely';
import { AccessRepository } from 'src/repositories/access.repository.js';
import { AlbumRepository } from 'src/repositories/album.repository.js';
import { AssetRepository } from 'src/repositories/asset.repository.js';
import { DownloadRepository } from 'src/repositories/download.repository.js';
import { EventRepository } from 'src/repositories/event.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { ResourceRepository } from 'src/repositories/resource.repository.js';
import { TagRepository } from 'src/repositories/tag.repository.js';
import { UserRepository } from 'src/repositories/user.repository.js';
import { Resource } from 'src/resource-paths.js';
import { DB } from 'src/schema/index.js';
import { AlbumService } from 'src/services/album.service.js';
import { newMediumService } from 'test/medium.factory.js';
import { factory } from 'test/small.factory.js';
import { getKyselyDB } from 'test/utils.js';

let defaultDatabase: Kysely<DB>;

// eslint-disable-next-line unicorn/no-unnecessary-parameters
const setup = (db?: Kysely<DB>) => {
  return newMediumService(AlbumService, {
    database: db || defaultDatabase,
    real: [AccessRepository, AlbumRepository, AssetRepository, TagRepository, UserRepository],
    mock: [LoggingRepository, ResourceRepository, EventRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(AlbumService.name, () => {
  it.each(['add', 'bulk', 'create'] as const)(
    'should allow unlocked owners to organize private photos using %s',
    async (action) => {
      const { sut, ctx } = setup();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      const { album, owner, sharedWith } = await ctx.newSharedAlbum();
      const { asset } = await ctx.newAsset({ ownerId: owner.id });
      const tag = await ctx.get(TagRepository).create({ userId: owner.id, value: 'private', isPrivate: true });
      await ctx.newTagAsset({ tagIds: [tag.id], assetIds: [asset.id] });
      const locked = factory.auth({ user: owner });
      const elevated = factory.auth({ user: owner, session: { hasElevatedPermission: true } });
      if (action === 'add') {
        await expect(sut.addAssets(locked, album.id, { ids: [asset.id] })).resolves.toMatchObject([{ success: false }]);
        await expect(sut.addAssets(elevated, album.id, { ids: [asset.id] })).resolves.toEqual([
          { id: asset.id, success: true },
        ]);
      } else if (action === 'bulk') {
        const dto = { albumIds: [album.id], assetIds: [asset.id] };
        await expect(sut.addAssetsToAlbums(locked, dto)).resolves.toMatchObject({ success: false });
        await expect(sut.addAssetsToAlbums(elevated, dto)).resolves.toMatchObject({ success: true });
      } else {
        const created = await sut.create(elevated, { albumName: 'Private selection', assetIds: [asset.id] });
        await expect(ctx.get(AlbumRepository).getAssetIds(created.id, [asset.id])).resolves.toEqual(
          new Set([asset.id]),
        );
      }
      await expect(
        ctx.get(AccessRepository).asset.checkAlbumAccess(sharedWith.id, new Set([asset.id])),
      ).resolves.toEqual(new Set());
    },
  );

  it('should share private photos only after the owner opts in and revoke access when disabled', async () => {
    const { sut, ctx } = setup();
    const { album, asset, owner, sharedWith } = await ctx.newSharedAlbum();
    const tag = await ctx.get(TagRepository).create({ userId: owner.id, value: 'private', isPrivate: true });
    await ctx.newTagAsset({ tagIds: [tag.id], assetIds: [asset.id] });
    await expect(ctx.get(AssetRepository).getById(asset.id, { tags: { privateOwnerId: null } })).resolves.toMatchObject(
      { tags: [] },
    );
    await expect(
      ctx.get(AssetRepository).getById(asset.id, { tags: { privateOwnerId: owner.id } }),
    ).resolves.toMatchObject({ tags: [expect.objectContaining({ id: tag.id })] });
    const member = factory.auth({ user: sharedWith });
    const lockedOwner = factory.auth({ user: owner });
    const elevatedOwner = factory.auth({ user: owner, session: { hasElevatedPermission: true } });
    const access = ctx.get(AccessRepository).asset;
    const downloads = new DownloadRepository(ctx.database);
    await ctx.newExif({ assetId: asset.id, fileSizeInByte: 10 });
    const { session } = await ctx.newSession({ userId: sharedWith.id });

    await expect(sut.get(member, album.id)).resolves.toMatchObject({ assetCount: 0, hasPrivateAssets: false });
    await expect(sut.getAll(member, { assetId: asset.id })).resolves.toEqual([]);
    await expect(sut.getAll(lockedOwner, { assetId: asset.id })).resolves.toEqual([]);
    await expect(sut.getAll(elevatedOwner, { assetId: asset.id })).resolves.toMatchObject([{ id: album.id }]);
    await expect(sut.get(lockedOwner, album.id)).resolves.toMatchObject({ hasPrivateAssets: true });
    await expect(sut.update(lockedOwner, album.id, { includePrivateAssets: true })).rejects.toThrow('Unlock private');
    await expect(sut.update(member, album.id, { includePrivateAssets: true })).rejects.toThrow('Only the album owner');

    await sut.update(elevatedOwner, album.id, { includePrivateAssets: true });
    await expect(sut.update(lockedOwner, album.id, { includePrivateAssets: true })).rejects.toThrow('Unlock private');
    await expect(sut.update(member, album.id, { includePrivateAssets: true })).rejects.toThrow('Only the album owner');
    await expect(
      ctx.database
        .selectFrom('session')
        .select('isPendingSyncReset')
        .where('id', '=', session.id)
        .executeTakeFirstOrThrow(),
    ).resolves.toMatchObject({ isPendingSyncReset: true });
    await expect(sut.get(member, album.id)).resolves.toMatchObject({ assetCount: 1, albumThumbnailAssetId: asset.id });
    await expect(sut.getAll(member, { assetId: asset.id })).resolves.toMatchObject([{ id: album.id }]);
    await expect(access.checkAlbumAccess(sharedWith.id, new Set([asset.id]))).resolves.toEqual(new Set([asset.id]));
    await expect(
      Array.fromAsync(downloads.downloadAlbumId(album.id, undefined, { albumUserId: sharedWith.id })),
    ).resolves.toEqual([expect.objectContaining({ id: asset.id })]);
    await expect(access.checkAlbumAccess(owner.id, new Set([asset.id]))).resolves.toEqual(new Set());

    const { asset: later } = await ctx.newAsset({ ownerId: owner.id });
    await ctx.newTagAsset({ tagIds: [tag.id], assetIds: [later.id] });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: later.id });
    await expect(sut.get(member, album.id)).resolves.toMatchObject({ assetCount: 2 });

    await sut.update(lockedOwner, album.id, { includePrivateAssets: false });
    await expect(sut.get(member, album.id)).resolves.toMatchObject({ assetCount: 0, albumThumbnailAssetId: null });
    await expect(access.checkAlbumAccess(sharedWith.id, new Set([asset.id, later.id]))).resolves.toEqual(new Set());
    await expect(
      Array.fromAsync(downloads.downloadAlbumId(album.id, undefined, { albumUserId: sharedWith.id })),
    ).resolves.toEqual([]);
  });

  it('should never expose another contributor’s private photos through the album owner’s opt-in', async () => {
    const { sut, ctx } = setup();
    const { album, owner, sharedWith } = await ctx.newSharedAlbum();
    const { asset } = await ctx.newAsset({ ownerId: sharedWith.id });
    const tag = await ctx.get(TagRepository).create({ userId: sharedWith.id, value: 'private', isPrivate: true });
    await ctx.newTagAsset({ tagIds: [tag.id], assetIds: [asset.id] });
    await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
    await sut.update(factory.auth({ user: owner, session: { hasElevatedPermission: true } }), album.id, {
      includePrivateAssets: true,
    });
    await expect(ctx.get(AccessRepository).asset.checkAlbumAccess(owner.id, new Set([asset.id]))).resolves.toEqual(
      new Set(),
    );
  });

  it('should omit a private cover and its contribution from the shared album', async () => {
    const { sut, ctx } = setup();
    const { album, asset, owner, sharedWith } = await ctx.newSharedAlbum();
    const auth = factory.auth({ user: sharedWith });
    await expect(sut.get(auth, album.id)).resolves.toMatchObject({ albumThumbnailAssetId: asset.id, assetCount: 1 });

    const tag = await ctx.get(TagRepository).create({ userId: owner.id, value: 'private', isPrivate: true });
    await ctx.newTagAsset({ tagIds: [tag.id], assetIds: [asset.id] });

    await expect(sut.get(auth, album.id)).resolves.toMatchObject({
      albumThumbnailAssetId: null,
      assetCount: 0,
      contributorCounts: [],
    });
  });

  describe('update', () => {
    it('should tell the owner and the shared user, but not a stranger', async () => {
      const { sut, ctx } = setup();
      const { album, owner, sharedWith } = await ctx.newSharedAlbum();
      const { user: stranger } = await ctx.newUser();

      await sut.update(factory.auth({ user: owner }), album.id, { albumName: 'Holiday' });

      const send = ctx.getMock(ResourceRepository).send;
      expect(send).toHaveBeenCalledTimes(1);
      const [{ userIds, changed }] = send.mock.calls[0];
      expect(userIds.toSorted()).toEqual([owner.id, sharedWith.id].toSorted());
      expect(userIds).not.toContain(stranger.id);
      expect(changed).toEqual([Resource.album(album)]);
    });
  });

  describe('removeAssets', () => {
    it('should not remove assets from an album of another user', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { user: otherUser } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { album } = await ctx.newAlbum({ ownerId: user.id }, [asset.id]);

      await expect(sut.removeAssets(factory.auth({ user: otherUser }), album.id, { ids: [asset.id] })).rejects.toThrow(
        'Not found or no albumAsset.delete access',
      );
      await expect(ctx.get(AlbumRepository).getAssetIds(album.id, [asset.id])).resolves.toContain(asset.id);
    });
  });

  describe('database triggers', () => {
    it('should cascade delete an album when the owner is deleted', async () => {
      const { ctx } = setup();
      const { user } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: user.id });

      await ctx.get(UserRepository).delete({ id: user.id }, true);

      await expect(ctx.database.selectFrom('album').selectAll().where('id', '=', album.id).execute()).resolves.toEqual(
        [],
      );
      await expect(
        ctx.database.selectFrom('album_user').selectAll().where('albumId', '=', album.id).execute(),
      ).resolves.toEqual([]);
    });
  });
});
