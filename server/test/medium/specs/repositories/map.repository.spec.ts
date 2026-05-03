import { Kysely } from 'kysely';
import { AssetVisibility } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MapRepository } from 'src/repositories/map.repository';
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
  return { ctx, sut: ctx.get(MapRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(MapRepository.name, () => {
  describe('getMapMarkers', () => {
    it('should include a direct shared_space_asset for a member with showInTimeline=true', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
      await ctx.database
        .insertInto('asset_exif')
        .values({
          assetId: asset.id,
          latitude: 48.8566,
          longitude: 2.3522,
          city: 'Paris',
          state: null,
          country: 'France',
        })
        .execute();
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });

      const results = await sut.getMapMarkers([member.id], [], { timelineSpaceIds: [space.id] });

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ id: asset.id, lat: 48.8566, lon: 2.3522 });
    });

    it('should include a library-linked asset via shared_space_library for a member', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id });
      const { library } = await ctx.newLibrary({ ownerId: owner.id });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id });
      const { asset } = await ctx.newAsset({
        ownerId: owner.id,
        libraryId: library.id,
        visibility: AssetVisibility.Timeline,
      });
      await ctx.database
        .insertInto('asset_exif')
        .values({ assetId: asset.id, latitude: 40.7128, longitude: -74.006 })
        .execute();

      const results = await sut.getMapMarkers([member.id], [], { timelineSpaceIds: [space.id] });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(asset.id);
    });

    it('should NOT include space asset when owner visibility=Archive and isArchived=undefined', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Archive });
      await ctx.database.insertInto('asset_exif').values({ assetId: asset.id, latitude: 1, longitude: 1 }).execute();
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });

      const results = await sut.getMapMarkers([member.id], [], { timelineSpaceIds: [space.id] });

      expect(results.find((r) => r.id === asset.id)).toBeUndefined();
    });

    it('should NOT include owner-archived space asset even when isArchived=true (member archive toggle does not leak owner archive)', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Archive });
      await ctx.database.insertInto('asset_exif').values({ assetId: asset.id, latitude: 2, longitude: 2 }).execute();
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });

      const results = await sut.getMapMarkers([member.id], [], { timelineSpaceIds: [space.id], isArchived: true });

      expect(results.find((r) => r.id === asset.id)).toBeUndefined();
    });

    it('should exclude space asset without GPS coordinates', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
      // no asset_exif row — asset has no GPS
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });

      const results = await sut.getMapMarkers([member.id], [], { timelineSpaceIds: [space.id] });

      expect(results.find((r) => r.id === asset.id)).toBeUndefined();
    });

    it('should exclude trashed space asset', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id });
      const { asset } = await ctx.newAsset({
        ownerId: owner.id,
        visibility: AssetVisibility.Timeline,
        deletedAt: new Date(),
      });
      await ctx.database.insertInto('asset_exif').values({ assetId: asset.id, latitude: 3, longitude: 3 }).execute();
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });

      const results = await sut.getMapMarkers([member.id], [], { timelineSpaceIds: [space.id] });

      expect(results.find((r) => r.id === asset.id)).toBeUndefined();
    });

    it('should exclude Locked-visibility space asset', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Locked });
      await ctx.database.insertInto('asset_exif').values({ assetId: asset.id, latitude: 4, longitude: 4 }).execute();
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });

      const results = await sut.getMapMarkers([member.id], [], { timelineSpaceIds: [space.id] });

      expect(results.find((r) => r.id === asset.id)).toBeUndefined();
    });

    it('should include library-linked asset when at least one containing space is passed in timelineSpaceIds', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      const { space: spaceA } = await ctx.newSharedSpace({ createdById: owner.id, name: 'A' });
      const { space: spaceB } = await ctx.newSharedSpace({ createdById: owner.id, name: 'B' });
      await ctx.newSharedSpaceMember({ spaceId: spaceA.id, userId: member.id });
      await ctx.newSharedSpaceMember({ spaceId: spaceB.id, userId: member.id });
      const { library } = await ctx.newLibrary({ ownerId: owner.id });
      await ctx.newSharedSpaceLibrary({ spaceId: spaceA.id, libraryId: library.id });
      await ctx.newSharedSpaceLibrary({ spaceId: spaceB.id, libraryId: library.id });
      const { asset } = await ctx.newAsset({
        ownerId: owner.id,
        libraryId: library.id,
        visibility: AssetVisibility.Timeline,
      });
      await ctx.database.insertInto('asset_exif').values({ assetId: asset.id, latitude: 5, longitude: 5 }).execute();

      const viaA = await sut.getMapMarkers([member.id], [], { timelineSpaceIds: [spaceA.id] });
      expect(viaA.find((r) => r.id === asset.id)).toBeDefined();

      const none = await sut.getMapMarkers([member.id], [], { timelineSpaceIds: [] });
      expect(none.find((r) => r.id === asset.id)).toBeUndefined();
    });

    it('should include direct space asset when at least one containing space is in timelineSpaceIds', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      const { space: spaceA } = await ctx.newSharedSpace({ createdById: owner.id, name: 'A' });
      const { space: spaceB } = await ctx.newSharedSpace({ createdById: owner.id, name: 'B' });
      await ctx.newSharedSpaceMember({ spaceId: spaceA.id, userId: member.id });
      await ctx.newSharedSpaceMember({ spaceId: spaceB.id, userId: member.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
      await ctx.database.insertInto('asset_exif').values({ assetId: asset.id, latitude: 6, longitude: 6 }).execute();
      await ctx.newSharedSpaceAsset({ spaceId: spaceA.id, assetId: asset.id });
      await ctx.newSharedSpaceAsset({ spaceId: spaceB.id, assetId: asset.id });

      const viaA = await sut.getMapMarkers([member.id], [], { timelineSpaceIds: [spaceA.id] });
      expect(viaA.find((r) => r.id === asset.id)).toBeDefined();
    });

    it('timeline opt-in: album-linked direct space asset requires a timeline-enabled containing space', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
      await ctx.database.insertInto('asset_exif').values({ assetId: asset.id, latitude: 7, longitude: 7 }).execute();
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      const { album } = await ctx.newAlbum({ ownerId: member.id });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });

      const hidden = await sut.getMapMarkers([member.id], [album.id]);
      const visible = await sut.getMapMarkers([member.id], [album.id], { timelineSpaceIds: [space.id] });

      expect(hidden.find((marker) => marker.id === asset.id)).toBeUndefined();
      expect(visible.find((marker) => marker.id === asset.id)).toBeDefined();
    });

    it('timeline opt-in: album-linked library space asset requires a timeline-enabled containing space', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      const { library } = await ctx.newLibrary({ ownerId: owner.id });
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id });
      const { asset } = await ctx.newAsset({
        ownerId: owner.id,
        libraryId: library.id,
        visibility: AssetVisibility.Timeline,
      });
      await ctx.database.insertInto('asset_exif').values({ assetId: asset.id, latitude: 8, longitude: 8 }).execute();
      const { album } = await ctx.newAlbum({ ownerId: member.id });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });

      const hidden = await sut.getMapMarkers([member.id], [album.id]);
      const visible = await sut.getMapMarkers([member.id], [album.id], { timelineSpaceIds: [space.id] });

      expect(hidden.find((marker) => marker.id === asset.id)).toBeUndefined();
      expect(visible.find((marker) => marker.id === asset.id)).toBeDefined();
    });
  });
});
