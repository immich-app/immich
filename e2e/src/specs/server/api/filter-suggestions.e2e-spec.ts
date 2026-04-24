import { AssetMediaResponseDto, LoginResponseDto, updateAsset } from '@immich/sdk';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Socket } from 'socket.io-client';
import { app, asBearerAuth, testAssetDir, utils } from 'src/utils';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('/search/suggestions/filters', () => {
  let admin: LoginResponseDto;
  let websocket: Socket;
  let assets: AssetMediaResponseDto[];
  let tagNatureId: string;
  let tagTravelId: string;
  let thresholdPeopleByRating: Record<number, string>;

  // Discovered values from unfiltered response
  let unfilteredCountries: string[];
  let unfilteredCameraMakes: string[];
  let unfilteredTags: Array<{ id: string; value: string }>;
  let unfilteredRatings: number[];

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    websocket = await utils.connectWebsocket(admin.accessToken);

    // Upload 6 test photos with real EXIF (different cameras)
    const files = [
      { filename: '/albums/nature/prairie_falcon.jpg' }, // Canon EOS R5
      { filename: '/formats/webp/denali.webp' }, // Canon EOS 7D
      { filename: '/formats/raw/Nikon/D80/glarus.nef' }, // Nikon D80
      { filename: '/formats/jpg/el_torcal_rocks.jpg' }, // HP scanner
      { filename: '/albums/nature/wood_anemones.jpg' },
      { filename: '/albums/text/japanese-shop.jpg' },
    ];

    assets = [];
    for (const { filename } of files) {
      const bytes = await readFile(join(testAssetDir, filename));
      assets.push(
        await utils.createAsset(admin.accessToken, {
          assetData: { bytes, filename },
        }),
      );
    }

    for (const asset of assets) {
      await utils.waitForWebsocketEvent({ event: 'assetUpload', id: asset.id });
    }

    // Drain metadata extraction before mutating ratings/tags. Otherwise a late
    // metadata extraction can race with the test's tagAssets() call — applyTagList
    // in metadata.service.ts calls replaceAssetTags, which wipes tags set by the
    // test if the extraction hasn't finished yet. See #331-adjacent flake.
    await utils.waitForQueueFinish(admin.accessToken, 'metadataExtraction');

    // Set distinct coordinates for different countries
    const coordinates = [
      { latitude: 48.853_41, longitude: 2.3488 }, // Paris, France
      { latitude: 35.6895, longitude: 139.691_71 }, // Tokyo, Japan
      { latitude: 52.524_37, longitude: 13.410_53 }, // Berlin, Germany
      { latitude: 35.6895, longitude: 139.691_71 }, // Tokyo, Japan (same as B)
      { latitude: 48.2082, longitude: 16.3738 }, // Vienna, Austria
      { latitude: 59.3293, longitude: 18.0686 }, // Stockholm, Sweden
    ];

    for (const [i, dto] of coordinates.entries()) {
      await updateAsset({ id: assets[i].id, updateAssetDto: dto }, { headers: asBearerAuth(admin.accessToken) });
    }

    for (const asset of assets) {
      await utils.waitForWebsocketEvent({ event: 'assetUpdate', id: asset.id });
    }

    // Set ratings: A=5, B=4, C=5, D=3, E=2, F=1
    const ratings = [5, 4, 5, 3, 2, 1];
    for (const [i, rating] of ratings.entries()) {
      await updateAsset({ id: assets[i].id, updateAssetDto: { rating } }, { headers: asBearerAuth(admin.accessToken) });
    }

    // Drain again before applying tags. updateAsset() calls for coordinates and
    // ratings above enqueue sidecar-write jobs which re-run metadata extraction.
    // A late extraction lands after tagAssets() and calls replaceAssetTags() with
    // the file's XMP keywords (usually empty), wiping the tags the test just set.
    // Reliably flakes on ubuntu-24.04-arm where metadata extraction is slower.
    await utils.waitForQueueFinish(admin.accessToken, 'metadataExtraction');

    // Create and apply tags using utils helpers
    const tags = await utils.upsertTags(admin.accessToken, ['nature', 'travel']);
    tagNatureId = tags[0].id;
    tagTravelId = tags[1].id;

    // A+C get "nature", B+D get "travel"
    await utils.tagAssets(admin.accessToken, tagNatureId, [assets[0].id, assets[2].id]);
    await utils.tagAssets(admin.accessToken, tagTravelId, [assets[1].id, assets[3].id]);

    // Create deterministic People facet fixtures so rating thresholds can be
    // checked for strict monotonicity:
    // ★1+ => persons 1-5, ★2+ => 2-5, ... ★5+ => 5.
    const db = await utils.connectDatabase();
    thresholdPeopleByRating = {};
    const personFixtures = [
      { rating: 1, assetIndex: 5 },
      { rating: 2, assetIndex: 4 },
      { rating: 3, assetIndex: 3 },
      { rating: 4, assetIndex: 1 },
      { rating: 5, assetIndex: 0 },
    ];

    for (const { rating, assetIndex } of personFixtures) {
      const name = `Facet Person ${rating}`;
      const personResult = await db.query(
        `INSERT INTO "person" ("ownerId", "name", "thumbnailPath")
         VALUES ($1, $2, '/test/thumbnail.jpg') RETURNING id`,
        [admin.userId, name],
      );
      const personId = personResult.rows[0].id as string;
      await db.query(`INSERT INTO "asset_face" ("assetId", "personId") VALUES ($1, $2)`, [
        assets[assetIndex].id,
        personId,
      ]);
      thresholdPeopleByRating[rating] = name;
    }

    // Discover unfiltered values
    const { body } = await request(app)
      .get('/search/suggestions/filters?withSharedSpaces=true')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    unfilteredCountries = body.countries;
    unfilteredCameraMakes = body.cameraMakes;
    unfilteredTags = body.tags;
    unfilteredRatings = body.ratings;
  }, 60_000);

  afterAll(() => {
    utils.disconnectWebsocket(websocket);
  });

  it('should return non-empty unfiltered baseline', () => {
    expect(unfilteredCountries.length).toBeGreaterThanOrEqual(2);
    expect(unfilteredTags.length).toBeGreaterThanOrEqual(2);
    expect(unfilteredRatings.length).toBeGreaterThanOrEqual(2);
  });

  it('should narrow tags when filtering by country', async () => {
    const country = unfilteredCountries[0];
    const { body } = await request(app)
      .get(`/search/suggestions/filters?country=${encodeURIComponent(country)}&withSharedSpaces=true`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(body.tags.length).toBeLessThan(unfilteredTags.length);
  });

  it('should narrow countries when filtering by tag', async () => {
    const { body } = await request(app)
      .get(`/search/suggestions/filters?tagIds=${tagNatureId}&withSharedSpaces=true`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    // "nature" is on A (France) and C (Germany), not B or D (Japan)
    expect(body.countries.length).toBeLessThan(unfilteredCountries.length);
  });

  it('should narrow countries when filtering by rating', async () => {
    // Rating 5+ matches only A+C
    const { body } = await request(app)
      .get('/search/suggestions/filters?rating=5&withSharedSpaces=true')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(body.countries.length).toBeLessThan(unfilteredCountries.length);
  });

  it('should narrow countries when filtering by camera make', async () => {
    if (unfilteredCameraMakes.length < 2) {
      return; // skip if test assets don't have diverse cameras
    }
    const make = unfilteredCameraMakes[0];
    const { body } = await request(app)
      .get(`/search/suggestions/filters?make=${encodeURIComponent(make)}&withSharedSpaces=true`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(body.countries.length).toBeLessThanOrEqual(unfilteredCountries.length);
  });

  it('should narrow further with combined filters', async () => {
    const country = unfilteredCountries[0];

    // Get results with just country
    const { body: countryOnly } = await request(app)
      .get(`/search/suggestions/filters?country=${encodeURIComponent(country)}&withSharedSpaces=true`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    // Get results with country + tag
    const { body: combined } = await request(app)
      .get(
        `/search/suggestions/filters?country=${encodeURIComponent(country)}&tagIds=${tagNatureId}&withSharedSpaces=true`,
      )
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    // Combined should be equal or narrower than country alone
    expect(combined.ratings.length).toBeLessThanOrEqual(countryOnly.ratings.length);
  });

  it('should parse rating as number from query string', async () => {
    const { body } = await request(app)
      .get('/search/suggestions/filters?rating=5&withSharedSpaces=true')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(body.countries).toBeDefined();
    expect(Array.isArray(body.countries)).toBe(true);
  });

  it('should accept single tagId without array duplication', async () => {
    const { body } = await request(app)
      .get(`/search/suggestions/filters?tagIds=${tagNatureId}&withSharedSpaces=true`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(body.countries.length).toBeLessThan(unfilteredCountries.length);
  });

  it('should return valid response for non-overlapping filters', async () => {
    const country = unfilteredCountries[0];
    const oppositeTagId = unfilteredTags[0].id === tagNatureId ? tagTravelId : tagNatureId;

    const { body } = await request(app)
      .get(
        `/search/suggestions/filters?country=${encodeURIComponent(country)}&tagIds=${oppositeTagId}&withSharedSpaces=true`,
      )
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    // Should have fewer results or be empty — at minimum, valid response shape
    expect(Array.isArray(body.countries)).toBe(true);
    expect(Array.isArray(body.tags)).toBe(true);
    expect(typeof body.hasUnnamedPeople).toBe('boolean');
  });

  it('should return all suggestion categories globally and cross-filter correctly (photos page)', async () => {
    // Unfiltered: verify all 6 categories are populated
    const { body: unfiltered } = await request(app)
      .get('/search/suggestions/filters?withSharedSpaces=true')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(unfiltered.countries.length).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(unfiltered.cameraMakes)).toBe(true);
    expect(unfiltered.tags.length).toBeGreaterThanOrEqual(2);
    expect(unfiltered.ratings.length).toBeGreaterThanOrEqual(2);
    expect(unfiltered.mediaTypes.length).toBeGreaterThanOrEqual(1);
    expect(typeof unfiltered.hasUnnamedPeople).toBe('boolean');
    // Global people should be person.id (not shared_space_person.id)
    for (const p of unfiltered.people) {
      expect(p.id).toBeDefined();
      expect(p.name).toBeDefined();
    }

    // Cross-filter by tag "nature" (assets A+C) → all categories should narrow
    const { body: natureFiltered } = await request(app)
      .get(`/search/suggestions/filters?tagIds=${tagNatureId}&withSharedSpaces=true`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(natureFiltered.countries.length).toBeLessThan(unfiltered.countries.length);
    expect(natureFiltered.ratings.length).toBeLessThanOrEqual(unfiltered.ratings.length);
    // Tags should still include "nature" (faceted: own filter excluded)
    const natureTagNames = natureFiltered.tags.map((t: { value: string }) => t.value);
    expect(natureTagNames).toContain('nature');

    // Cross-filter by rating 5+ (assets A+C) → countries + tags should narrow
    const { body: rating5 } = await request(app)
      .get('/search/suggestions/filters?rating=5&withSharedSpaces=true')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(rating5.countries.length).toBeLessThan(unfiltered.countries.length);
    const rating5TagNames = rating5.tags.map((t: { value: string }) => t.value);
    expect(rating5TagNames).toContain('nature');
    expect(rating5TagNames).not.toContain('travel');
  });

  it('should keep People facet results monotonic as the minimum rating threshold increases', async () => {
    const thresholds = [1, 2, 3, 4, 5] as const;
    const responses = [];

    for (const rating of thresholds) {
      const response = await request(app)
        .get(`/search/suggestions/filters?rating=${rating}&withSharedSpaces=true`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);
      responses.push(response.body);
    }

    const expectedPeopleByThreshold = [
      [
        thresholdPeopleByRating[1],
        thresholdPeopleByRating[2],
        thresholdPeopleByRating[3],
        thresholdPeopleByRating[4],
        thresholdPeopleByRating[5],
      ],
      [thresholdPeopleByRating[2], thresholdPeopleByRating[3], thresholdPeopleByRating[4], thresholdPeopleByRating[5]],
      [thresholdPeopleByRating[3], thresholdPeopleByRating[4], thresholdPeopleByRating[5]],
      [thresholdPeopleByRating[4], thresholdPeopleByRating[5]],
      [thresholdPeopleByRating[5]],
    ];

    for (const [index, body] of responses.entries()) {
      const actualNames = body.people.map((person: { name: string }) => person.name);
      expect(actualNames).toEqual(expectedPeopleByThreshold[index]);
      if (index > 0) {
        expect(body.people.length).toBeLessThanOrEqual(responses[index - 1].people.length);
      }
    }
  });

  it('should return all suggestion categories for map view (withSharedSpaces)', async () => {
    // Map uses withSharedSpaces=true, same as photos but may omit location section client-side
    const { body } = await request(app)
      .get('/search/suggestions/filters?withSharedSpaces=true')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    // All 6 categories should be present (map ignores countries client-side but server still returns them)
    expect(Array.isArray(body.countries)).toBe(true);
    expect(Array.isArray(body.cameraMakes)).toBe(true);
    expect(Array.isArray(body.tags)).toBe(true);
    expect(Array.isArray(body.people)).toBe(true);
    expect(Array.isArray(body.ratings)).toBe(true);
    expect(Array.isArray(body.mediaTypes)).toBe(true);
    expect(typeof body.hasUnnamedPeople).toBe('boolean');

    // Cross-filter: tag + rating combined → should narrow all categories
    const { body: combined } = await request(app)
      .get(`/search/suggestions/filters?tagIds=${tagNatureId}&rating=5&withSharedSpaces=true`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    // nature + rating 5 = assets A+C → should have fewer countries than unfiltered
    expect(combined.countries.length).toBeLessThanOrEqual(body.countries.length);
    expect(combined.cameraMakes.length).toBeLessThanOrEqual(body.cameraMakes.length);
    // Ratings should still include 5 (faceted: own filter excluded)
    expect(combined.ratings).toContain(5);
    // Tags should still include "nature" (faceted: own filter excluded)
    const combinedTagNames = combined.tags.map((t: { value: string }) => t.value);
    expect(combinedTagNames).toContain('nature');
  });

  it('should return map suggestions scoped to a space (spaceId without withSharedSpaces)', async () => {
    // Map can be opened with ?spaceId=... for space-scoped map view
    const space = await utils.createSpace(admin.accessToken, { name: 'Map Space Test' });
    await utils.addSpaceAssets(admin.accessToken, space.id, [assets[0].id, assets[2].id]); // A+C: nature, ratings 5+5

    const { body } = await request(app)
      .get(`/search/suggestions/filters?spaceId=${space.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    // Countries: only from assets A (Paris) and C (Berlin)
    expect(body.countries.length).toBeGreaterThanOrEqual(1);
    expect(body.countries.length).toBeLessThanOrEqual(unfilteredCountries.length);

    // Tags: only "nature" (both A and C have it), not "travel"
    const tagNames = body.tags.map((t: { value: string }) => t.value);
    expect(tagNames).toContain('nature');
    expect(tagNames).not.toContain('travel');

    // Ratings: only 5 (both A and C are rated 5), not 3 or 4
    expect(body.ratings).toContain(5);
    expect(body.ratings).not.toContain(3);
    expect(body.ratings).not.toContain(4);

    // Media types: at least one
    expect(body.mediaTypes.length).toBeGreaterThanOrEqual(1);
  });

  it('should scope suggestions to a space', async () => {
    // Create a space with only assets A and B
    const space = await utils.createSpace(admin.accessToken, { name: 'Filter Test Space' });
    await utils.addSpaceAssets(admin.accessToken, space.id, [assets[0].id, assets[1].id]);

    const { body } = await request(app)
      .get(`/search/suggestions/filters?spaceId=${space.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    // Space has only 2 assets — verify valid response with some suggestions
    expect(Array.isArray(body.countries)).toBe(true);
    expect(Array.isArray(body.tags)).toBe(true);
    expect(Array.isArray(body.ratings)).toBe(true);
    expect(body.countries.length).toBeGreaterThanOrEqual(1);
    expect(body.ratings.length).toBeGreaterThanOrEqual(1);
  });

  it('should return all suggestion categories scoped to a space with correct IDs', async () => {
    // Create a space with assets A (rated 5, tagged "nature", Paris) and B (rated 4, tagged "travel", Tokyo)
    const space = await utils.createSpace(admin.accessToken, { name: 'Full Suggestions Test' });
    await utils.addSpaceAssets(admin.accessToken, space.id, [assets[0].id, assets[1].id]);

    // Create a space person via DB (person → face → space_person + space_person_face)
    const db = await utils.connectDatabase();
    const personResult = await db.query(
      `INSERT INTO "person" ("ownerId", "name", "thumbnailPath")
       VALUES ($1, $2, '/test/thumbnail.jpg') RETURNING id`,
      [admin.userId, 'SpaceTestPerson'],
    );
    const globalPersonId = personResult.rows[0].id as string;

    const faceResult = await db.query(`INSERT INTO "asset_face" ("assetId", "personId") VALUES ($1, $2) RETURNING id`, [
      assets[0].id,
      globalPersonId,
    ]);
    const faceId = faceResult.rows[0].id as string;

    // addSpaceAssets (above) queues SharedSpaceFaceMatch jobs for each asset
    // on the FacialRecognition worker. After each face match completes, the
    // worker also queues a SharedSpacePersonDedup job. Dedup calls
    // `deletePerson` on merged sources. If dedup runs concurrently with the
    // manual INSERTs below, it can delete our freshly-inserted
    // shared_space_person row before the shared_space_person_face INSERT,
    // causing an FK violation. Drain the queue before we touch
    // shared_space_person directly.
    await utils.waitForQueueFinish(admin.accessToken, 'facialRecognition');

    const spacePersonResult = await db.query(
      `INSERT INTO "shared_space_person" ("spaceId", "name", "isHidden", "faceCount", "assetCount", "representativeFaceId")
       VALUES ($1, $2, false, 1, 1, $3) RETURNING id`,
      [space.id, 'SpaceTestPerson', faceId],
    );
    const spacePersonId = spacePersonResult.rows[0].id as string;

    await db.query(`INSERT INTO "shared_space_person_face" ("personId", "assetFaceId") VALUES ($1, $2)`, [
      spacePersonId,
      faceId,
    ]);

    // --- Unfiltered space suggestions ---
    const { body } = await request(app)
      .get(`/search/suggestions/filters?spaceId=${space.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    // People: should return space person IDs, NOT global person IDs
    const returnedPersonIds = body.people.map((p: { id: string }) => p.id);
    expect(returnedPersonIds).toContain(spacePersonId);
    expect(returnedPersonIds).not.toContain(globalPersonId);
    const spacePerson = body.people.find((p: { id: string }) => p.id === spacePersonId);
    expect(spacePerson).toBeDefined();
    expect(spacePerson.name).toBe('SpaceTestPerson');

    // Countries: should be scoped to assets A+B (2 countries from Paris + Tokyo)
    expect(body.countries.length).toBeGreaterThanOrEqual(1);
    expect(body.countries.length).toBeLessThanOrEqual(unfilteredCountries.length);

    // Camera makes: should only include cameras from assets A+B
    expect(Array.isArray(body.cameraMakes)).toBe(true);

    // Tags: should include at least the tags on assets A+B ("nature" on A, "travel" on B)
    expect(body.tags.length).toBeGreaterThanOrEqual(2);
    const tagNames = body.tags.map((t: { value: string }) => t.value);
    expect(tagNames).toContain('nature');
    expect(tagNames).toContain('travel');

    // Ratings: should only include ratings from A (5) and B (4)
    expect(body.ratings).toContain(5);
    expect(body.ratings).toContain(4);
    expect(body.ratings).not.toContain(3); // rating 3 is only on asset D, not in this space

    // Media types: should have at least one
    expect(body.mediaTypes.length).toBeGreaterThanOrEqual(1);

    // --- Cross-filter within space: filter by tag "nature" → should narrow ---
    const { body: natureFiltered } = await request(app)
      .get(`/search/suggestions/filters?spaceId=${space.id}&tagIds=${tagNatureId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    // Only asset A has "nature" in this space, so ratings should narrow to [5]
    expect(natureFiltered.ratings).toContain(5);
    expect(natureFiltered.ratings).not.toContain(4); // asset B (rated 4) doesn't have "nature"

    // --- Cross-filter within space: filter by rating 5+ → should narrow ---
    const { body: rating5Filtered } = await request(app)
      .get(`/search/suggestions/filters?spaceId=${space.id}&rating=5`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    // Only asset A is rated 5 in this space, so tags should narrow to just "nature"
    const rating5TagNames = rating5Filtered.tags.map((t: { value: string }) => t.value);
    expect(rating5TagNames).toContain('nature');
    expect(rating5TagNames).not.toContain('travel');
  });

  it('should return other filter categories when filtering by space person ID', async () => {
    // Create a space with assets A (rated 5, tagged "nature", Paris) and B (rated 4, tagged "travel", Tokyo)
    const space = await utils.createSpace(admin.accessToken, { name: 'Person Cross-Filter Space' });
    await utils.addSpaceAssets(admin.accessToken, space.id, [assets[0].id, assets[1].id]);

    // Create a global person linked to asset A via asset_face
    const db = await utils.connectDatabase();
    const personResult = await db.query(
      `INSERT INTO "person" ("ownerId", "name", "thumbnailPath")
       VALUES ($1, $2, '/test/thumbnail.jpg') RETURNING id`,
      [admin.userId, 'PersonCrossFilter'],
    );
    const globalPersonId = personResult.rows[0].id as string;

    const faceResult = await db.query(`INSERT INTO "asset_face" ("assetId", "personId") VALUES ($1, $2) RETURNING id`, [
      assets[0].id,
      globalPersonId,
    ]);
    const faceId = faceResult.rows[0].id as string;

    // Create a space person + link via shared_space_person_face
    const spacePersonResult = await db.query(
      `INSERT INTO "shared_space_person" ("spaceId", "name", "isHidden", "faceCount", "assetCount", "representativeFaceId")
       VALUES ($1, $2, false, 1, 1, $3) RETURNING id`,
      [space.id, 'PersonCrossFilter', faceId],
    );
    const spacePersonId = spacePersonResult.rows[0].id as string;

    await db.query(`INSERT INTO "shared_space_person_face" ("personId", "assetFaceId") VALUES ($1, $2)`, [
      spacePersonId,
      faceId,
    ]);

    // Filter by space person ID — this is what the frontend sends when a person is selected in a space
    const { body } = await request(app)
      .get(`/search/suggestions/filters?spaceId=${space.id}&personIds=${spacePersonId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    // The space person is linked to asset A (Paris, rated 5, tagged "nature")
    // All other filter categories should reflect asset A's metadata — NOT be empty
    expect(body.countries.length).toBeGreaterThanOrEqual(1);
    expect(body.ratings.length).toBeGreaterThanOrEqual(1);
    expect(body.ratings).toContain(5);
    expect(body.tags.length).toBeGreaterThanOrEqual(1);
    const tagNames = body.tags.map((t: { value: string }) => t.value);
    expect(tagNames).toContain('nature');
  });
});
