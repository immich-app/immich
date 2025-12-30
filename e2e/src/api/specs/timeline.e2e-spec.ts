import {
  addAssetsToAlbum,
  AlbumUserRole,
  AssetMediaResponseDto,
  AssetVisibility,
  createTag,
  LoginResponseDto,
} from '@immich/sdk';
import { createUserDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

const timelineDates = {
  buckets: {
    jan: '2024-01-01',
    feb: '2024-02-01',
    mar: '2024-03-01',
    apr: '2024-04-01',
    may: '2024-05-01',
    jun: '2024-06-01',
    jul: '2024-07-01',
    aug: '2024-08-01',
    sep: '2024-09-01',
  },
  iso: {
    janOwned: '2024-01-15T12:00:00Z',
    janShared: '2024-01-20T12:00:00Z',
    febOwned: '2024-02-10T12:00:00Z',
    febShared: '2024-02-11T12:00:00Z',
    marOwned: '2024-03-10T12:00:00Z',
    aprBase: '2024-04-',
    mayShared: '2024-05-10T12:00:00Z',
    junShared: '2024-06-10T12:00:00Z',
    julShared: '2024-07-10T12:00:00Z',
    augShared: '2024-08-10T12:00:00Z',
    sepShared: '2024-09-10T12:00:00Z',
  },
};

let deviceAssetCounter = 0;

const createAssetAt = async (accessToken: string, isoDate: string): Promise<AssetMediaResponseDto> => {
  deviceAssetCounter += 1;
  return utils.createAsset(accessToken, {
    deviceAssetId: `timeline-${deviceAssetCounter}`,
    fileCreatedAt: isoDate,
    fileModifiedAt: isoDate,
    visibility: AssetVisibility.Timeline,
  });
};

const setShowInTimeline = async (accessToken: string, albumId: string, userId: string, showInTimeline: boolean) => {
  const { status } = await request(app)
    .put(`/albums/${albumId}/user/${userId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ showInTimeline });

  expect(status).toBe(204);
};

const createSharedAlbumWithAsset = async ({
  owner,
  sharedUser,
  albumName,
  assetDate,
  role = AlbumUserRole.Viewer,
  showInTimeline = true,
}: {
  owner: LoginResponseDto;
  sharedUser: LoginResponseDto;
  albumName: string;
  assetDate: string;
  role?: AlbumUserRole;
  showInTimeline?: boolean;
}) => {
  const asset = await createAssetAt(owner.accessToken, assetDate);
  const album = await utils.createAlbum(owner.accessToken, {
    albumName,
    assetIds: [asset.id],
    albumUsers: [{ userId: sharedUser.userId, role }],
  });

  await setShowInTimeline(sharedUser.accessToken, album.id, sharedUser.userId, showInTimeline);

  return { asset, album };
};

describe('/timeline', () => {
  let admin: LoginResponseDto;
  let user1: LoginResponseDto;
  let user2: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();

    admin = await utils.adminSetup();

    [user1, user2] = await Promise.all([
      utils.userSetup(admin.accessToken, createUserDto.user1),
      utils.userSetup(admin.accessToken, createUserDto.user2),
    ]);
  });

  describe('GET /timeline/buckets', () => {
    it('should include shared album assets when withSharedAlbums is true', async () => {
      await createAssetAt(user1.accessToken, timelineDates.iso.janOwned);
      await createSharedAlbumWithAsset({
        owner: user2,
        sharedUser: user1,
        albumName: 'timeline-shared-buckets',
        assetDate: timelineDates.iso.janShared,
      });

      const { status, body } = await request(app)
        .get('/timeline/buckets')
        .query({ withSharedAlbums: true, visibility: AssetVisibility.Timeline })
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.arrayContaining([expect.objectContaining({ timeBucket: timelineDates.buckets.jan, count: 2 })]),
      );
    });

    it('should exclude shared album assets when withSharedAlbums is omitted', async () => {
      await createSharedAlbumWithAsset({
        owner: user2,
        sharedUser: user1,
        albumName: 'timeline-shared-omitted',
        assetDate: timelineDates.iso.mayShared,
      });

      const { status, body } = await request(app)
        .get('/timeline/buckets')
        .query({ visibility: AssetVisibility.Timeline })
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ timeBucket: timelineDates.buckets.may })]),
      );
    });

    it('should exclude shared album assets when showInTimeline is false', async () => {
      await createSharedAlbumWithAsset({
        owner: user2,
        sharedUser: user1,
        albumName: 'timeline-shared-disabled',
        assetDate: timelineDates.iso.junShared,
        showInTimeline: false,
      });

      const { status, body } = await request(app)
        .get('/timeline/buckets')
        .query({ withSharedAlbums: true, visibility: AssetVisibility.Timeline })
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ timeBucket: timelineDates.buckets.jun })]),
      );
    });

    it('should toggle showInTimeline preference and update timeline accordingly', async () => {
      const { album } = await createSharedAlbumWithAsset({
        owner: user2,
        sharedUser: user1,
        albumName: 'timeline-toggle-test',
        assetDate: timelineDates.iso.augShared,
        showInTimeline: true,
      });

      // Verify asset is initially in timeline
      let response = await request(app)
        .get('/timeline/buckets')
        .query({ withSharedAlbums: true, visibility: AssetVisibility.Timeline })
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.arrayContaining([expect.objectContaining({ timeBucket: timelineDates.buckets.aug })]),
      );

      // Toggle to false
      await setShowInTimeline(user1.accessToken, album.id, user1.userId, false);

      response = await request(app)
        .get('/timeline/buckets')
        .query({ withSharedAlbums: true, visibility: AssetVisibility.Timeline })
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ timeBucket: timelineDates.buckets.aug })]),
      );

      // Toggle back to true
      await setShowInTimeline(user1.accessToken, album.id, user1.userId, true);

      response = await request(app)
        .get('/timeline/buckets')
        .query({ withSharedAlbums: true, visibility: AssetVisibility.Timeline })
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.arrayContaining([expect.objectContaining({ timeBucket: timelineDates.buckets.aug })]),
      );
    });

    it('should handle many shared albums without dropping results', async () => {
      const albumCount = 20;
      const createdAssetIds: string[] = [];

      for (let i = 0; i < albumCount; i += 1) {
        const day = String(i + 1).padStart(2, '0');
        const { asset } = await createSharedAlbumWithAsset({
          owner: user2,
          sharedUser: user1,
          albumName: `timeline-perf-${i}`,
          assetDate: `${timelineDates.iso.aprBase}${day}T12:00:00Z`,
        });
        createdAssetIds.push(asset.id);
      }

      const { status, body } = await request(app)
        .get('/timeline/buckets')
        .query({ withSharedAlbums: true, visibility: AssetVisibility.Timeline })
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.arrayContaining([expect.objectContaining({ timeBucket: timelineDates.buckets.apr, count: albumCount })]),
      );

      // Verify all assets are returned when querying the bucket
      const bucketResponse = await request(app)
        .get('/timeline/bucket')
        .query({ timeBucket: timelineDates.buckets.apr, withSharedAlbums: true, visibility: AssetVisibility.Timeline })
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(bucketResponse.status).toBe(200);
      expect(bucketResponse.body.id).toEqual(expect.arrayContaining(createdAssetIds));
      expect(bucketResponse.body.id.length).toBeGreaterThanOrEqual(albumCount);

      // Verify all asset IDs are distinct
      const uniqueIds = new Set(bucketResponse.body.id);
      expect(uniqueIds.size).toBe(bucketResponse.body.id.length);
    });

    it('should deduplicate shared assets across multiple albums in buckets', async () => {
      const asset = await createAssetAt(user2.accessToken, timelineDates.iso.julShared);

      const albumOne = await utils.createAlbum(user2.accessToken, {
        albumName: 'timeline-shared-dedup-1',
        assetIds: [asset.id],
        albumUsers: [{ userId: user1.userId, role: AlbumUserRole.Viewer }],
      });
      const albumTwo = await utils.createAlbum(user2.accessToken, {
        albumName: 'timeline-shared-dedup-2',
        assetIds: [asset.id],
        albumUsers: [{ userId: user1.userId, role: AlbumUserRole.Viewer }],
      });

      await setShowInTimeline(user1.accessToken, albumOne.id, user1.userId, true);
      await setShowInTimeline(user1.accessToken, albumTwo.id, user1.userId, true);

      const { status, body } = await request(app)
        .get('/timeline/buckets')
        .query({ withSharedAlbums: true, visibility: AssetVisibility.Timeline })
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.arrayContaining([expect.objectContaining({ timeBucket: timelineDates.buckets.jul, count: 1 })]),
      );
    });

    it('should show timeline assets for Editor role in shared albums', async () => {
      await createSharedAlbumWithAsset({
        owner: user2,
        sharedUser: user1,
        albumName: 'timeline-editor-role',
        assetDate: timelineDates.iso.sepShared,
        role: AlbumUserRole.Editor,
        showInTimeline: true,
      });

      const { status, body } = await request(app)
        .get('/timeline/buckets')
        .query({ withSharedAlbums: true, visibility: AssetVisibility.Timeline })
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.arrayContaining([expect.objectContaining({ timeBucket: timelineDates.buckets.sep })]),
      );
    });

    it('should reject withSharedAlbums with albumId, personId, or tagId filters', async () => {
      const asset = await createAssetAt(user1.accessToken, timelineDates.iso.janOwned);
      const album = await utils.createAlbum(user1.accessToken, {
        albumName: 'timeline-shared-album-filter',
        assetIds: [asset.id],
      });
      const tag = await createTag(
        { tagCreateDto: { name: 'timeline-shared-album-tag' } },
        { headers: asBearerAuth(user1.accessToken) },
      );
      const person = await utils.createPerson(user1.accessToken);

      const cases = [
        { name: 'albumId', query: { albumId: album.id } },
        { name: 'personId', query: { personId: person.id } },
        { name: 'tagId', query: { tagId: tag.id } },
      ];

      for (const testCase of cases) {
        const { status, body } = await request(app)
          .get('/timeline/buckets')
          .query({
            ...testCase.query,
            withSharedAlbums: true,
            visibility: AssetVisibility.Timeline,
          })
          .set('Authorization', `Bearer ${user1.accessToken}`);

        expect(status).toBe(400);
        expect(body).toEqual(
          errorDto.badRequest('withSharedAlbums is not supported with albumId, personId, or tagId filters'),
        );
      }
    });

    it('should reject withSharedAlbums for archived, trashed, or unspecified visibility', async () => {
      const cases = [
        { name: 'visibility omitted', query: {} },
        { name: 'archived visibility', query: { visibility: AssetVisibility.Archive } },
        { name: 'trashed', query: { visibility: AssetVisibility.Timeline, isTrashed: true } },
      ];

      for (const testCase of cases) {
        const { status, body } = await request(app)
          .get('/timeline/buckets')
          .query({ ...testCase.query, withSharedAlbums: true })
          .set('Authorization', `Bearer ${user1.accessToken}`);

        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest('withSharedAlbums is only supported for non-archived, non-trashed assets'));
      }
    });
  });

  describe('GET /timeline/bucket', () => {
    it('should include isShared flags for shared album assets', async () => {
      const ownedAsset = await createAssetAt(user1.accessToken, timelineDates.iso.febOwned);
      const { asset: sharedAsset } = await createSharedAlbumWithAsset({
        owner: user2,
        sharedUser: user1,
        albumName: 'timeline-is-shared',
        assetDate: timelineDates.iso.febShared,
      });

      const { status, body } = await request(app)
        .get('/timeline/bucket')
        .query({ timeBucket: timelineDates.buckets.feb, withSharedAlbums: true, visibility: AssetVisibility.Timeline })
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body.id).toEqual(expect.arrayContaining([ownedAsset.id, sharedAsset.id]));
      expect(body.isShared).toBeDefined();

      const isSharedById = Object.fromEntries(body.id.map((id: string, index: number) => [id, body.isShared[index]]));
      expect(isSharedById[ownedAsset.id]).toBe(false);
      expect(isSharedById[sharedAsset.id]).toBe(true);
    });

    it('should deduplicate owned assets in shared albums when querying general timeline', async () => {
      const ownedAsset = await createAssetAt(user1.accessToken, timelineDates.iso.marOwned);
      const album = await utils.createAlbum(user2.accessToken, {
        albumName: 'timeline-dedup-general',
        albumUsers: [{ userId: user1.userId, role: AlbumUserRole.Editor }],
      });

      await addAssetsToAlbum(
        { id: album.id, bulkIdsDto: { ids: [ownedAsset.id] } },
        { headers: asBearerAuth(user1.accessToken) },
      );
      await setShowInTimeline(user1.accessToken, album.id, user1.userId, true);

      const { status, body } = await request(app)
        .get('/timeline/bucket')
        .query({
          timeBucket: timelineDates.buckets.mar,
          withSharedAlbums: true,
          visibility: AssetVisibility.Timeline,
        })
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body.isShared).toBeDefined();

      const occurrences = body.id.filter((id: string) => id === ownedAsset.id).length;
      expect(occurrences).toBe(1);

      const ownedIndex = body.id.indexOf(ownedAsset.id);
      expect(body.isShared[ownedIndex]).toBe(false);
    });
  });
});
