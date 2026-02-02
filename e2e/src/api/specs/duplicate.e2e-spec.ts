import { LoginResponseDto } from '@immich/sdk';
import { createUserDto, uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('/duplicates', () => {
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

  beforeEach(async () => {
    // Reset assets, albums, tags, and stacks between tests to ensure clean state for repeated test runs
    // Note: We don't reset users since they're set up once in beforeAll
    // Stack must be reset before asset due to foreign key constraint
    await utils.resetDatabase(['stack', 'asset', 'album', 'tag']);
  });

  describe('GET /duplicates', () => {
    it('should return empty array when no duplicates', async () => {
      const { status, body } = await request(app)
        .get('/duplicates')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual([]);
    });

    it('should return duplicate groups with suggestedKeepAssetIds', async () => {
      // Create assets with different file sizes for duplicate detection
      const [asset1, asset2] = await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);

      // Manually set duplicateId on both assets to create a duplicate group
      const duplicateId = '00000000-0000-4000-8000-000000000001';
      await utils.setAssetDuplicateId(user1.accessToken, asset1.id, duplicateId);
      await utils.setAssetDuplicateId(user1.accessToken, asset2.id, duplicateId);

      const { status, body } = await request(app)
        .get('/duplicates')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual([
        {
          duplicateId,
          assets: expect.arrayContaining([
            expect.objectContaining({ id: asset1.id }),
            expect.objectContaining({ id: asset2.id }),
          ]),
          suggestedKeepAssetIds: expect.any(Array),
        },
      ]);
      expect(body[0].suggestedKeepAssetIds.length).toBe(1);
    });
  });

  describe('POST /duplicates/resolve', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app)
        .post('/duplicates/resolve')
        .send({
          groups: [{ duplicateId: uuidDto.dummy, keepAssetIds: [], trashAssetIds: [] }],
          settings: {
            synchronizeAlbums: false,
            synchronizeVisibility: false,
            synchronizeFavorites: false,
            synchronizeRating: false,
            synchronizeDescription: false,
            synchronizeLocation: false,
            synchronizeTags: false,
          },
        });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should return failure for non-existent duplicate group', async () => {
      const { status, body } = await request(app)
        .post('/duplicates/resolve')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({
          groups: [{ duplicateId: uuidDto.dummy, keepAssetIds: [], trashAssetIds: [] }],
          settings: {
            synchronizeAlbums: false,
            synchronizeVisibility: false,
            synchronizeFavorites: false,
            synchronizeRating: false,
            synchronizeDescription: false,
            synchronizeLocation: false,
            synchronizeTags: false,
          },
        });

      expect(status).toBe(200);
      expect(body).toEqual({
        status: 'COMPLETED',
        results: [
          {
            duplicateId: uuidDto.dummy,
            status: 'FAILED',
            reason: expect.stringContaining('not found or access denied'),
          },
        ],
      });
    });

    it('should resolve duplicate group with keepers', async () => {
      const [asset1, asset2] = await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);

      const duplicateId = '00000000-0000-4000-8000-000000000002';
      await utils.setAssetDuplicateId(user1.accessToken, asset1.id, duplicateId);
      await utils.setAssetDuplicateId(user1.accessToken, asset2.id, duplicateId);

      const { status, body } = await request(app)
        .post('/duplicates/resolve')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({
          groups: [{ duplicateId, keepAssetIds: [asset1.id], trashAssetIds: [asset2.id] }],
          settings: {
            synchronizeAlbums: false,
            synchronizeVisibility: false,
            synchronizeFavorites: false,
            synchronizeRating: false,
            synchronizeDescription: false,
            synchronizeLocation: false,
            synchronizeTags: false,
          },
        });

      expect(status).toBe(200);
      expect(body).toEqual({
        status: 'COMPLETED',
        results: [
          {
            duplicateId,
            status: 'SUCCESS',
          },
        ],
      });

      // Verify side effects: duplicateId cleared on kept asset
      const keptAsset = await utils.getAssetInfo(user1.accessToken, asset1.id);
      expect(keptAsset.duplicateId).toBeNull();

      // Verify side effects: trashed asset is trashed and duplicateId cleared
      const trashedAsset = await utils.getAssetInfo(user1.accessToken, asset2.id);
      expect(trashedAsset.isTrashed).toBe(true);
      expect(trashedAsset.duplicateId).toBeNull();
    });

    it('should reject when keepAssetIds and trashAssetIds overlap', async () => {
      const [asset1, asset2] = await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);

      const duplicateId = '00000000-0000-4000-8000-000000000003';
      await utils.setAssetDuplicateId(user1.accessToken, asset1.id, duplicateId);
      await utils.setAssetDuplicateId(user1.accessToken, asset2.id, duplicateId);

      const { status, body } = await request(app)
        .post('/duplicates/resolve')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({
          groups: [{ duplicateId, keepAssetIds: [asset1.id], trashAssetIds: [asset1.id] }],
          settings: {
            synchronizeAlbums: false,
            synchronizeVisibility: false,
            synchronizeFavorites: false,
            synchronizeRating: false,
            synchronizeDescription: false,
            synchronizeLocation: false,
            synchronizeTags: false,
          },
        });

      expect(status).toBe(200);
      expect(body.results[0].status).toBe('FAILED');
      expect(body.results[0].reason).toContain('disjoint');
    });

    it('should require keepAssetIds when partially trashing', async () => {
      const [asset1, asset2] = await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);

      const duplicateId = '00000000-0000-4000-8000-000000000004';
      await utils.setAssetDuplicateId(user1.accessToken, asset1.id, duplicateId);
      await utils.setAssetDuplicateId(user1.accessToken, asset2.id, duplicateId);

      const { status, body } = await request(app)
        .post('/duplicates/resolve')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({
          groups: [{ duplicateId, keepAssetIds: [], trashAssetIds: [asset1.id] }],
          settings: {
            synchronizeAlbums: false,
            synchronizeVisibility: false,
            synchronizeFavorites: false,
            synchronizeRating: false,
            synchronizeDescription: false,
            synchronizeLocation: false,
            synchronizeTags: false,
          },
        });

      expect(status).toBe(200);
      expect(body.results[0].status).toBe('FAILED');
      expect(body.results[0].reason).toContain('must cover all assets');
    });

    it('should reject partial resolution (not all assets covered)', async () => {
      const [asset1, asset2, asset3] = await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);

      const duplicateId = '00000000-0000-4000-8000-000000000010';
      await utils.setAssetDuplicateId(user1.accessToken, asset1.id, duplicateId);
      await utils.setAssetDuplicateId(user1.accessToken, asset2.id, duplicateId);
      await utils.setAssetDuplicateId(user1.accessToken, asset3.id, duplicateId);

      const { status, body } = await request(app)
        .post('/duplicates/resolve')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({
          groups: [{ duplicateId, keepAssetIds: [asset1.id], trashAssetIds: [asset2.id] }],
          settings: {
            synchronizeAlbums: false,
            synchronizeVisibility: false,
            synchronizeFavorites: false,
            synchronizeRating: false,
            synchronizeDescription: false,
            synchronizeLocation: false,
            synchronizeTags: false,
          },
        });

      expect(status).toBe(200);
      expect(body.results[0].status).toBe('FAILED');
      expect(body.results[0].reason).toContain('must cover all assets');
    });

    it('should reject asset not in duplicate group', async () => {
      const [asset1, asset2, outsideAsset] = await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);

      const duplicateId = '00000000-0000-4000-8000-000000000011';
      await utils.setAssetDuplicateId(user1.accessToken, asset1.id, duplicateId);
      await utils.setAssetDuplicateId(user1.accessToken, asset2.id, duplicateId);

      const { status, body } = await request(app)
        .post('/duplicates/resolve')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({
          groups: [{ duplicateId, keepAssetIds: [asset1.id], trashAssetIds: [outsideAsset.id] }],
          settings: {
            synchronizeAlbums: false,
            synchronizeVisibility: false,
            synchronizeFavorites: false,
            synchronizeRating: false,
            synchronizeDescription: false,
            synchronizeLocation: false,
            synchronizeTags: false,
          },
        });

      expect(status).toBe(200);
      expect(body.results[0].status).toBe('FAILED');
      expect(body.results[0].reason).toContain('not a member of duplicate group');
    });

    it('should allow trash-all without keepers', async () => {
      const [asset1, asset2] = await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);

      const duplicateId = '00000000-0000-4000-8000-000000000012';
      await utils.setAssetDuplicateId(user1.accessToken, asset1.id, duplicateId);
      await utils.setAssetDuplicateId(user1.accessToken, asset2.id, duplicateId);

      const { status, body } = await request(app)
        .post('/duplicates/resolve')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({
          groups: [{ duplicateId, keepAssetIds: [], trashAssetIds: [asset1.id, asset2.id] }],
          settings: {
            synchronizeAlbums: false,
            synchronizeVisibility: false,
            synchronizeFavorites: false,
            synchronizeRating: false,
            synchronizeDescription: false,
            synchronizeLocation: false,
            synchronizeTags: false,
          },
        });

      expect(status).toBe(200);
      expect(body).toEqual({
        status: 'COMPLETED',
        results: [
          {
            duplicateId,
            status: 'SUCCESS',
          },
        ],
      });

      // Verify both assets are trashed
      const [asset1Info, asset2Info] = await Promise.all([
        utils.getAssetInfo(user1.accessToken, asset1.id),
        utils.getAssetInfo(user1.accessToken, asset2.id),
      ]);

      expect(asset1Info.isTrashed).toBe(true);
      expect(asset1Info.duplicateId).toBeNull();
      expect(asset2Info.isTrashed).toBe(true);
      expect(asset2Info.duplicateId).toBeNull();
    });

    it('should reject cross-user duplicate group access', async () => {
      const asset1 = await utils.createAsset(user1.accessToken);
      const asset2 = await utils.createAsset(user2.accessToken);

      const duplicateId = '00000000-0000-4000-8000-000000000013';
      await utils.setAssetDuplicateId(user1.accessToken, asset1.id, duplicateId);
      await utils.setAssetDuplicateId(user2.accessToken, asset2.id, duplicateId);

      // User1 tries to resolve a group containing user2's asset
      const { status, body } = await request(app)
        .post('/duplicates/resolve')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({
          groups: [{ duplicateId, keepAssetIds: [asset1.id], trashAssetIds: [asset2.id] }],
          settings: {
            synchronizeAlbums: false,
            synchronizeVisibility: false,
            synchronizeFavorites: false,
            synchronizeRating: false,
            synchronizeDescription: false,
            synchronizeLocation: false,
            synchronizeTags: false,
          },
        });

      expect(status).toBe(200);
      expect(body.results[0].status).toBe('FAILED');
      expect(body.results[0].reason).toContain('not a member of duplicate group');
    });

    it('should synchronize favorites when enabled', async () => {
      const [asset1, asset2] = await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);

      // Mark one asset as favorite
      await request(app)
        .put('/assets')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ ids: [asset2.id], isFavorite: true });

      const duplicateId = '00000000-0000-4000-8000-000000000020';
      await utils.setAssetDuplicateId(user1.accessToken, asset1.id, duplicateId);
      await utils.setAssetDuplicateId(user1.accessToken, asset2.id, duplicateId);

      const { status, body } = await request(app)
        .post('/duplicates/resolve')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({
          groups: [{ duplicateId, keepAssetIds: [asset1.id], trashAssetIds: [asset2.id] }],
          settings: {
            synchronizeAlbums: false,
            synchronizeVisibility: false,
            synchronizeFavorites: true,
            synchronizeRating: false,
            synchronizeDescription: false,
            synchronizeLocation: false,
            synchronizeTags: false,
          },
        });

      expect(status).toBe(200);
      expect(body.results[0].status).toBe('SUCCESS');

      // Verify favorite was synchronized to keeper
      const keptAsset = await utils.getAssetInfo(user1.accessToken, asset1.id);
      expect(keptAsset.isFavorite).toBe(true);
      expect(keptAsset.duplicateId).toBeNull();
    });

    it('should synchronize visibility when enabled', async () => {
      const [asset1, asset2] = await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);

      // Archive one asset
      await utils.archiveAssets(user1.accessToken, [asset2.id]);

      const duplicateId = '00000000-0000-4000-8000-000000000021';
      await utils.setAssetDuplicateId(user1.accessToken, asset1.id, duplicateId);
      await utils.setAssetDuplicateId(user1.accessToken, asset2.id, duplicateId);

      const { status, body } = await request(app)
        .post('/duplicates/resolve')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({
          groups: [{ duplicateId, keepAssetIds: [asset1.id], trashAssetIds: [asset2.id] }],
          settings: {
            synchronizeAlbums: false,
            synchronizeVisibility: true,
            synchronizeFavorites: false,
            synchronizeRating: false,
            synchronizeDescription: false,
            synchronizeLocation: false,
            synchronizeTags: false,
          },
        });

      expect(status).toBe(200);
      expect(body.results[0].status).toBe('SUCCESS');

      // Verify visibility was synchronized to keeper
      const keptAsset = await utils.getAssetInfo(user1.accessToken, asset1.id);
      expect(keptAsset.visibility).toBe('archive');
      expect(keptAsset.duplicateId).toBeNull();
    });

    it('should synchronize rating when enabled', async () => {
      const [asset1, asset2] = await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);

      // Set rating on one asset
      await request(app)
        .put('/assets')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ ids: [asset2.id], rating: 5 });

      const duplicateId = '00000000-0000-4000-8000-000000000022';
      await utils.setAssetDuplicateId(user1.accessToken, asset1.id, duplicateId);
      await utils.setAssetDuplicateId(user1.accessToken, asset2.id, duplicateId);

      const { status, body } = await request(app)
        .post('/duplicates/resolve')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({
          groups: [{ duplicateId, keepAssetIds: [asset1.id], trashAssetIds: [asset2.id] }],
          settings: {
            synchronizeAlbums: false,
            synchronizeVisibility: false,
            synchronizeFavorites: false,
            synchronizeRating: true,
            synchronizeDescription: false,
            synchronizeLocation: false,
            synchronizeTags: false,
          },
        });

      expect(status).toBe(200);
      expect(body.results[0].status).toBe('SUCCESS');

      // Verify rating was synchronized to keeper
      const keptAsset = await utils.getAssetInfo(user1.accessToken, asset1.id);
      expect(keptAsset.exifInfo?.rating).toBe(5);
      expect(keptAsset.duplicateId).toBeNull();
    });

    it('should synchronize description when enabled', async () => {
      const [asset1, asset2] = await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);

      // Set description on one asset
      await request(app)
        .put('/assets')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ ids: [asset2.id], description: 'Test description for duplicate' });

      const duplicateId = '00000000-0000-4000-8000-000000000023';
      await utils.setAssetDuplicateId(user1.accessToken, asset1.id, duplicateId);
      await utils.setAssetDuplicateId(user1.accessToken, asset2.id, duplicateId);

      const { status, body } = await request(app)
        .post('/duplicates/resolve')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({
          groups: [{ duplicateId, keepAssetIds: [asset1.id], trashAssetIds: [asset2.id] }],
          settings: {
            synchronizeAlbums: false,
            synchronizeVisibility: false,
            synchronizeFavorites: false,
            synchronizeRating: false,
            synchronizeDescription: true,
            synchronizeLocation: false,
            synchronizeTags: false,
          },
        });

      expect(status).toBe(200);
      expect(body.results[0].status).toBe('SUCCESS');

      // Verify description was synchronized to keeper
      const keptAsset = await utils.getAssetInfo(user1.accessToken, asset1.id);
      expect(keptAsset.exifInfo?.description).toBe('Test description for duplicate');
      expect(keptAsset.duplicateId).toBeNull();
    });

    it('should synchronize location when enabled', async () => {
      const [asset1, asset2] = await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);

      // Set location on one asset
      await request(app)
        .put('/assets')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ ids: [asset2.id], latitude: 40.7128, longitude: -74.006 });

      const duplicateId = '00000000-0000-4000-8000-000000000024';
      await utils.setAssetDuplicateId(user1.accessToken, asset1.id, duplicateId);
      await utils.setAssetDuplicateId(user1.accessToken, asset2.id, duplicateId);

      const { status, body } = await request(app)
        .post('/duplicates/resolve')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({
          groups: [{ duplicateId, keepAssetIds: [asset1.id], trashAssetIds: [asset2.id] }],
          settings: {
            synchronizeAlbums: false,
            synchronizeVisibility: false,
            synchronizeFavorites: false,
            synchronizeRating: false,
            synchronizeDescription: false,
            synchronizeLocation: true,
            synchronizeTags: false,
          },
        });

      expect(status).toBe(200);
      expect(body.results[0].status).toBe('SUCCESS');

      // Verify location was synchronized to keeper
      const keptAsset = await utils.getAssetInfo(user1.accessToken, asset1.id);
      expect(keptAsset.exifInfo?.latitude).toBe(40.7128);
      expect(keptAsset.exifInfo?.longitude).toBe(-74.006);
      expect(keptAsset.duplicateId).toBeNull();
    });

    it('should synchronize albums when enabled', async () => {
      const [asset1, asset2] = await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);

      // Create albums and add assets to different albums
      const album1 = await utils.createAlbum(user1.accessToken, {
        albumName: 'Album 1',
        assetIds: [asset1.id],
      });
      const album2 = await utils.createAlbum(user1.accessToken, {
        albumName: 'Album 2',
        assetIds: [asset2.id],
      });

      const duplicateId = '00000000-0000-4000-8000-000000000025';
      await utils.setAssetDuplicateId(user1.accessToken, asset1.id, duplicateId);
      await utils.setAssetDuplicateId(user1.accessToken, asset2.id, duplicateId);

      const { status, body } = await request(app)
        .post('/duplicates/resolve')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({
          groups: [{ duplicateId, keepAssetIds: [asset1.id], trashAssetIds: [asset2.id] }],
          settings: {
            synchronizeAlbums: true,
            synchronizeVisibility: false,
            synchronizeFavorites: false,
            synchronizeRating: false,
            synchronizeDescription: false,
            synchronizeLocation: false,
            synchronizeTags: false,
          },
        });

      expect(status).toBe(200);
      expect(body.results[0].status).toBe('SUCCESS');

      // Verify keeper is now in both albums
      const keptAsset = await utils.getAssetInfo(user1.accessToken, asset1.id);
      expect(keptAsset.duplicateId).toBeNull();

      // Check albums directly
      const { status: album1Status, body: album1Body } = await request(app)
        .get(`/albums/${album1.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      const { status: album2Status, body: album2Body } = await request(app)
        .get(`/albums/${album2.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(album1Status).toBe(200);
      expect(album2Status).toBe(200);
      expect(album1Body.assets.map((a: any) => a.id)).toContain(asset1.id);
      expect(album2Body.assets.map((a: any) => a.id)).toContain(asset1.id);
    });

    it('should synchronize tags when enabled', async () => {
      const [asset1, asset2] = await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);

      // Wait for metadata extraction to complete before adding tags
      // Otherwise, metadata jobs will race and overwrite our tags
      await utils.waitForQueueFinish(admin.accessToken, 'metadataExtraction');

      // Create tags and tag assets differently
      const tags = await utils.upsertTags(user1.accessToken, ['tag1', 'tag2']);
      await utils.tagAssets(user1.accessToken, tags[0].id, [asset1.id]);
      await utils.tagAssets(user1.accessToken, tags[1].id, [asset2.id]);

      const duplicateId = '00000000-0000-4000-8000-000000000026';
      await utils.setAssetDuplicateId(user1.accessToken, asset1.id, duplicateId);
      await utils.setAssetDuplicateId(user1.accessToken, asset2.id, duplicateId);

      const { status, body } = await request(app)
        .post('/duplicates/resolve')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({
          groups: [{ duplicateId, keepAssetIds: [asset1.id], trashAssetIds: [asset2.id] }],
          settings: {
            synchronizeAlbums: false,
            synchronizeVisibility: false,
            synchronizeFavorites: false,
            synchronizeRating: false,
            synchronizeDescription: false,
            synchronizeLocation: false,
            synchronizeTags: true,
          },
        });

      expect(status).toBe(200);
      expect(body.results[0].status).toBe('SUCCESS');

      // Verify keeper has both tags
      const keptAsset = await utils.getAssetInfo(user1.accessToken, asset1.id);
      expect(keptAsset.duplicateId).toBeNull();
      expect(keptAsset.tags).toBeDefined();
      const tagIds = keptAsset.tags?.map((t) => t.id) || [];
      expect(tagIds).toContain(tags[0].id);
      expect(tagIds).toContain(tags[1].id);
    });

    it('should handle batch resolve with mixed success and failure', async () => {
      // Create first group that will succeed
      const [asset1, asset2] = await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);
      const duplicateId1 = '00000000-0000-4000-8000-000000000027';
      await utils.setAssetDuplicateId(user1.accessToken, asset1.id, duplicateId1);
      await utils.setAssetDuplicateId(user1.accessToken, asset2.id, duplicateId1);

      // Create second group with non-existent duplicate ID (will fail)
      const fakeId = '00000000-0000-4000-8000-000000000099';

      const { status, body } = await request(app)
        .post('/duplicates/resolve')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({
          groups: [
            { duplicateId: duplicateId1, keepAssetIds: [asset1.id], trashAssetIds: [asset2.id] },
            { duplicateId: fakeId, keepAssetIds: [], trashAssetIds: [] },
          ],
          settings: {
            synchronizeAlbums: false,
            synchronizeVisibility: false,
            synchronizeFavorites: false,
            synchronizeRating: false,
            synchronizeDescription: false,
            synchronizeLocation: false,
            synchronizeTags: false,
          },
        });

      expect(status).toBe(200);
      expect(body.status).toBe('COMPLETED');
      expect(body.results).toHaveLength(2);

      // First group should succeed
      expect(body.results[0].duplicateId).toBe(duplicateId1);
      expect(body.results[0].status).toBe('SUCCESS');

      // Second group should fail
      expect(body.results[1].duplicateId).toBe(fakeId);
      expect(body.results[1].status).toBe('FAILED');
      expect(body.results[1].reason).toContain('not found or access denied');

      // Verify first group was actually resolved despite second failure
      const asset1Info = await utils.getAssetInfo(user1.accessToken, asset1.id);
      expect(asset1Info.duplicateId).toBeNull();
      const asset2Info = await utils.getAssetInfo(user1.accessToken, asset2.id);
      expect(asset2Info.isTrashed).toBe(true);
    });

    it('should trash assets when trash is enabled', async () => {
      const [asset1, asset2] = await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);

      const duplicateId = '00000000-0000-4000-8000-000000000028';
      await utils.setAssetDuplicateId(user1.accessToken, asset1.id, duplicateId);
      await utils.setAssetDuplicateId(user1.accessToken, asset2.id, duplicateId);

      // Ensure trash is enabled (default)
      const config = await utils.getSystemConfig(admin.accessToken);
      expect(config.trash.enabled).toBe(true);

      const { status, body } = await request(app)
        .post('/duplicates/resolve')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({
          groups: [{ duplicateId, keepAssetIds: [asset1.id], trashAssetIds: [asset2.id] }],
          settings: {
            synchronizeAlbums: false,
            synchronizeVisibility: false,
            synchronizeFavorites: false,
            synchronizeRating: false,
            synchronizeDescription: false,
            synchronizeLocation: false,
            synchronizeTags: false,
          },
        });

      expect(status).toBe(200);
      expect(body.results[0].status).toBe('SUCCESS');

      // Verify asset is trashed (not deleted)
      const trashedAsset = await utils.getAssetInfo(user1.accessToken, asset2.id);
      expect(trashedAsset.isTrashed).toBe(true);
    });

    it('should delete assets when trash is disabled', async () => {
      const [asset1, asset2] = await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);

      const duplicateId = '00000000-0000-4000-8000-000000000029';
      await utils.setAssetDuplicateId(user1.accessToken, asset1.id, duplicateId);
      await utils.setAssetDuplicateId(user1.accessToken, asset2.id, duplicateId);

      // Disable trash
      await request(app)
        .put('/system-config')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          trash: { enabled: false, days: 30 },
        });

      const { status, body } = await request(app)
        .post('/duplicates/resolve')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({
          groups: [{ duplicateId, keepAssetIds: [asset1.id], trashAssetIds: [asset2.id] }],
          settings: {
            synchronizeAlbums: false,
            synchronizeVisibility: false,
            synchronizeFavorites: false,
            synchronizeRating: false,
            synchronizeDescription: false,
            synchronizeLocation: false,
            synchronizeTags: false,
          },
        });

      expect(status).toBe(200);
      expect(body.results[0].status).toBe('SUCCESS');

      // Asset should be marked as deleted (force delete)
      const { status: getStatus } = await request(app)
        .get(`/assets/${asset2.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      // Asset should still be accessible (soft deleted) but marked as deleted
      expect(getStatus).toBe(200);

      // Re-enable trash for other tests
      await utils.resetAdminConfig(admin.accessToken);
    });
  });
});
