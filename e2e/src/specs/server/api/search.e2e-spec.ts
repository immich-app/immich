import {
  AssetMediaResponseDto,
  AssetResponseDto,
  AssetVisibility,
  deleteAssets,
  LoginResponseDto,
  SharedSpaceResponseDto,
  updateAsset,
} from '@immich/sdk';
import { DateTime } from 'luxon';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Socket } from 'socket.io-client';
import { app, asBearerAuth, TEN_TIMES, testAssetDir, utils } from 'src/utils';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
const today = DateTime.now();

describe('/search', () => {
  let admin: LoginResponseDto;
  let websocket: Socket;

  let assetFalcon: AssetMediaResponseDto;
  let assetDenali: AssetMediaResponseDto;
  let assetCyclamen: AssetMediaResponseDto;
  let assetNotocactus: AssetMediaResponseDto;
  let assetSilver: AssetMediaResponseDto;
  let assetDensity: AssetMediaResponseDto;
  // let assetPhiladelphia: AssetMediaResponseDto;
  // let assetOrychophragmus: AssetMediaResponseDto;
  // let assetRidge: AssetMediaResponseDto;
  // let assetPolemonium: AssetMediaResponseDto;
  // let assetWood: AssetMediaResponseDto;
  // let assetGlarus: AssetMediaResponseDto;
  let assetHeic: AssetMediaResponseDto;
  let assetRocks: AssetMediaResponseDto;
  let assetOneJpg6: AssetMediaResponseDto;
  let assetOneHeic6: AssetMediaResponseDto;
  let assetOneJpg5: AssetMediaResponseDto;
  let assetSprings: AssetMediaResponseDto;
  let assetLast: AssetMediaResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    websocket = await utils.connectWebsocket(admin.accessToken);

    const files = [
      { filename: '/albums/nature/prairie_falcon.jpg' },
      { filename: '/formats/webp/denali.webp' },
      { filename: '/albums/nature/cyclamen_persicum.jpg', dto: { isFavorite: true } },
      { filename: '/albums/nature/notocactus_minimus.jpg' },
      { filename: '/albums/nature/silver_fir.jpg' },
      { filename: '/formats/heic/IMG_2682.heic' },
      { filename: '/formats/jpg/el_torcal_rocks.jpg' },
      { filename: '/formats/motionphoto/samsung-one-ui-6.jpg' },
      { filename: '/formats/motionphoto/samsung-one-ui-6.heic' },
      { filename: '/formats/motionphoto/samsung-one-ui-5.jpg' },

      { filename: '/metadata/gps-position/thompson-springs.jpg', dto: { visibility: AssetVisibility.Archive } },

      // used for search suggestions
      { filename: '/formats/png/density_plot.png' },
      { filename: '/formats/raw/Nikon/D80/glarus.nef' },
      { filename: '/formats/raw/Nikon/D700/philadelphia.nef' },
      { filename: '/albums/nature/orychophragmus_violaceus.jpg' },
      { filename: '/albums/nature/tanners_ridge.jpg' },
      { filename: '/albums/nature/polemonium_reptans.jpg' },

      // last asset
      { filename: '/albums/nature/wood_anemones.jpg' },
    ];
    const assets: AssetMediaResponseDto[] = [];
    for (const { filename, dto } of files) {
      const bytes = await readFile(join(testAssetDir, filename));
      assets.push(
        await utils.createAsset(admin.accessToken, {
          deviceAssetId: `test-${filename}`,
          assetData: { bytes, filename },
          ...dto,
        }),
      );
    }

    for (const asset of assets) {
      await utils.waitForWebsocketEvent({ event: 'assetUpload', id: asset.id });
    }

    // note: the coordinates here are not the actual coordinates of the images and are random for most of them
    const coordinates = [
      { latitude: 48.853_41, longitude: 2.3488 }, // paris
      { latitude: 35.6895, longitude: 139.691_71 }, // tokyo
      { latitude: 52.524_37, longitude: 13.410_53 }, // berlin
      { latitude: 1.314_663_1, longitude: 103.845_409_3 }, // singapore
      { latitude: 41.013_84, longitude: 28.949_66 }, // istanbul
      { latitude: 5.556_02, longitude: -0.1969 }, // accra
      { latitude: 37.544_270_6, longitude: -4.727_752_8 }, // andalusia
      { latitude: 23.133_02, longitude: -82.383_04 }, // havana
      { latitude: 41.694_11, longitude: 44.833_68 }, // tbilisi
      { latitude: 31.222_22, longitude: 121.458_06 }, // shanghai
      { latitude: 38.9711, longitude: -109.7137 }, // thompson springs
      { latitude: 40.714_27, longitude: -74.005_97 }, // new york
      { latitude: 47.040_57, longitude: 9.068_04 }, // glarus
      { latitude: 32.771_52, longitude: -89.116_73 }, // philadelphia
      { latitude: 31.634_16, longitude: -7.999_94 }, // marrakesh
      { latitude: 38.523_735_4, longitude: -78.488_619_4 }, // tanners ridge
      { latitude: 59.938_63, longitude: 30.314_13 }, // st. petersburg
      { latitude: 0, longitude: 0 }, // null island
    ];

    const updates = coordinates.map((dto, i) =>
      updateAsset({ id: assets[i].id, updateAssetDto: dto }, { headers: asBearerAuth(admin.accessToken) }),
    );

    await Promise.all(updates);
    for (const [i] of coordinates.entries()) {
      await utils.waitForWebsocketEvent({ event: 'assetUpdate', id: assets[i].id });
    }

    [
      assetFalcon,
      assetDenali,
      assetCyclamen,
      assetNotocactus,
      assetSilver,
      assetHeic,
      assetRocks,
      assetOneJpg6,
      assetOneHeic6,
      assetOneJpg5,
      assetSprings,
      assetDensity,
      // assetGlarus,
      // assetPhiladelphia,
      // assetOrychophragmus,
      // assetRidge,
      // assetPolemonium,
      // assetWood,
    ] = assets;

    assetLast = assets.at(-1) as AssetMediaResponseDto;

    await deleteAssets({ assetBulkDeleteDto: { ids: [assetSilver.id] } }, { headers: asBearerAuth(admin.accessToken) });
  }, 30_000);

  afterAll(async () => {
    utils.disconnectWebsocket(websocket);
  });

  describe('POST /search/metadata', () => {
    const searchTests = [
      {
        should: 'should get my assets',
        deferred: () => ({ dto: { size: 1 }, assets: [assetLast] }),
      },
      {
        should: 'should sort my assets in reverse',
        deferred: () => ({ dto: { order: 'asc', size: 2 }, assets: [assetCyclamen, assetNotocactus] }),
      },
      {
        should: 'should support pagination',
        deferred: () => ({ dto: { order: 'asc', size: 1, page: 2 }, assets: [assetNotocactus] }),
      },
      {
        should: 'should search by checksum (base64)',
        deferred: () => ({ dto: { checksum: '9IXBDMjj9OrQb+1YMHprZJgZ/UQ=' }, assets: [assetCyclamen] }),
      },
      {
        should: 'should search by checksum (hex)',
        deferred: () => ({ dto: { checksum: 'f485c10cc8e3f4ead06fed58307a6b649819fd44' }, assets: [assetCyclamen] }),
      },
      { should: 'should search by id', deferred: () => ({ dto: { id: assetCyclamen.id }, assets: [assetCyclamen] }) },
      {
        should: 'should search by isFavorite (true)',
        deferred: () => ({ dto: { isFavorite: true }, assets: [assetCyclamen] }),
      },
      {
        should: 'should search by isFavorite (false)',
        deferred: () => ({ dto: { size: 1, isFavorite: false }, assets: [assetLast] }),
      },
      {
        should: 'should search by visibility (AssetVisibility.Archive)',
        deferred: () => ({ dto: { visibility: AssetVisibility.Archive }, assets: [assetSprings] }),
      },
      {
        should: 'should search by visibility (AssetVisibility.Timeline)',
        deferred: () => ({ dto: { size: 1, visibility: AssetVisibility.Timeline }, assets: [assetLast] }),
      },
      {
        should: 'should search by type (image)',
        deferred: () => ({ dto: { size: 1, type: 'IMAGE' }, assets: [assetLast] }),
      },
      {
        should: 'should search by type (video)',
        deferred: () => ({
          dto: { type: 'VIDEO', visibility: AssetVisibility.Hidden },
          assets: [
            // the three live motion photos
            { id: expect.any(String) },
            { id: expect.any(String) },
            { id: expect.any(String) },
          ],
        }),
      },
      {
        should: 'should search by trashedBefore',
        deferred: () => ({ dto: { trashedBefore: today.plus({ hour: 1 }).toJSDate() }, assets: [assetSilver] }),
      },
      {
        should: 'should search by trashedBefore (no results)',
        deferred: () => ({ dto: { trashedBefore: today.minus({ days: 1 }).toJSDate() }, assets: [] }),
      },
      {
        should: 'should search by trashedAfter',
        deferred: () => ({ dto: { trashedAfter: today.minus({ hour: 1 }).toJSDate() }, assets: [assetSilver] }),
      },
      {
        should: 'should search by trashedAfter (no results)',
        deferred: () => ({ dto: { trashedAfter: today.plus({ hour: 1 }).toJSDate() }, assets: [] }),
      },
      {
        should: 'should search by takenBefore',
        deferred: () => ({ dto: { size: 1, takenBefore: today.plus({ hour: 1 }).toJSDate() }, assets: [assetLast] }),
      },
      {
        should: 'should search by takenBefore (no results)',
        deferred: () => ({ dto: { takenBefore: DateTime.fromObject({ year: 1234 }).toJSDate() }, assets: [] }),
      },
      {
        should: 'should search by takenAfter',
        deferred: () => ({
          dto: { size: 1, takenAfter: DateTime.fromObject({ year: 1234 }).toJSDate() },
          assets: [assetLast],
        }),
      },
      {
        should: 'should search by takenAfter (no results)',
        deferred: () => ({ dto: { takenAfter: today.plus({ hour: 1 }).toJSDate() }, assets: [] }),
      },
      {
        should: 'should search by originalFilename',
        deferred: () => ({
          dto: { originalFileName: 'rocks' },
          assets: [assetRocks],
        }),
      },
      {
        should: 'should search by originalFilename with spaces',
        deferred: () => ({
          dto: { originalFileName: 'samsung-one', type: 'IMAGE' },
          assets: [assetOneJpg5, assetOneJpg6, assetOneHeic6],
        }),
      },
      {
        should: 'should search by city',
        deferred: () => ({
          dto: {
            city: 'Accra',
            includeNull: true,
          },
          assets: [assetHeic],
        }),
      },
      {
        should: "should search city ('')",
        deferred: () => ({
          dto: {
            city: '',
            visibility: AssetVisibility.Timeline,
            includeNull: true,
          },
          assets: [assetLast],
        }),
      },
      {
        should: 'should search city (null)',
        deferred: () => ({
          dto: {
            city: null,
            visibility: AssetVisibility.Timeline,
            includeNull: true,
          },
          assets: [assetLast],
        }),
      },
      {
        should: 'should search by state',
        deferred: () => ({
          dto: {
            state: 'New York',
            includeNull: true,
          },
          assets: [assetDensity],
        }),
      },
      {
        should: "should search state ('')",
        deferred: () => ({
          dto: {
            state: '',
            visibility: AssetVisibility.Timeline,
            withExif: true,
            includeNull: true,
          },
          assets: [assetLast, assetNotocactus],
        }),
      },
      {
        should: 'should search state (null)',
        deferred: () => ({
          dto: {
            state: null,
            visibility: AssetVisibility.Timeline,
            includeNull: true,
          },
          assets: [assetLast, assetNotocactus],
        }),
      },
      {
        should: 'should search by country',
        deferred: () => ({
          dto: {
            country: 'France',
            includeNull: true,
          },
          assets: [assetFalcon],
        }),
      },
      {
        should: "should search country ('')",
        deferred: () => ({
          dto: {
            country: '',
            visibility: AssetVisibility.Timeline,
            includeNull: true,
          },
          assets: [assetLast],
        }),
      },
      {
        should: 'should search country (null)',
        deferred: () => ({
          dto: {
            country: null,
            visibility: AssetVisibility.Timeline,
            includeNull: true,
          },
          assets: [assetLast],
        }),
      },
      {
        should: 'should search by make',
        deferred: () => ({
          dto: {
            make: 'Canon',
            includeNull: true,
          },
          assets: [assetFalcon, assetDenali],
        }),
      },
      {
        should: 'should search by model',
        deferred: () => ({
          dto: {
            model: 'Canon EOS 7D',
            includeNull: true,
          },
          assets: [assetDenali],
        }),
      },
      {
        should: 'should allow searching the upload library (libraryId: null)',
        deferred: () => ({
          dto: { libraryId: null, size: 1 },
          assets: [assetLast],
        }),
      },
    ];

    for (const { should, deferred } of searchTests) {
      it(should, async () => {
        const { assets, dto } = deferred();
        const { status, body } = await request(app)
          .post('/search/metadata')
          .send(dto)
          .set('Authorization', `Bearer ${admin.accessToken}`);
        expect(status).toBe(200);
        expect(body.assets).toBeDefined();
        expect(Array.isArray(body.assets.items)).toBe(true);
        for (const [i, asset] of assets.entries()) {
          expect(body.assets.items[i]).toEqual(expect.objectContaining({ id: asset.id }));
        }
        expect(body.assets.items).toHaveLength(assets.length);
      });
    }
  });

  describe('POST /search/random', () => {
    beforeAll(async () => {
      await Promise.all([
        utils.createAsset(admin.accessToken),
        utils.createAsset(admin.accessToken),
        utils.createAsset(admin.accessToken),
        utils.createAsset(admin.accessToken),
        utils.createAsset(admin.accessToken),
        utils.createAsset(admin.accessToken),
      ]);

      await utils.waitForQueueFinish(admin.accessToken, 'thumbnailGeneration');
    });

    it.each(TEN_TIMES)('should return 1 random assets', async () => {
      const { status, body } = await request(app)
        .post('/search/random')
        .send({ size: 1 })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);

      const assets: AssetResponseDto[] = body;
      expect(assets.length).toBe(1);
      expect(assets[0].ownerId).toBe(admin.userId);
    });

    it.each(TEN_TIMES)('should return 2 random assets', async () => {
      const { status, body } = await request(app)
        .post('/search/random')
        .send({ size: 2 })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);

      const assets: AssetResponseDto[] = body;
      expect(assets.length).toBe(2);
      expect(assets[0].ownerId).toBe(admin.userId);
      expect(assets[1].ownerId).toBe(admin.userId);
    });
  });

  describe('GET /search/explore', () => {
    it('should get explore data', async () => {
      const { status, body } = await request(app)
        .get('/search/explore')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual([{ fieldName: 'exifInfo.city', items: [] }]);
    });
  });

  describe('GET /search/places', () => {
    it('should get relevant places', async () => {
      const name = 'Paris';

      const { status, body } = await request(app)
        .get(`/search/places?name=${name}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      if (Array.isArray(body)) {
        expect(body.length).toBeGreaterThan(10);
        expect(body[0].name).toEqual(name);
        expect(body[0].admin2name).toEqual(name);
      }
    });
  });

  describe('GET /search/cities', () => {
    it('should get all cities', async () => {
      const { status, body } = await request(app)
        .get('/search/cities')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      if (Array.isArray(body)) {
        expect(body.length).toBeGreaterThan(10);
        const assetsWithCity = body.filter((asset) => !!asset.exifInfo?.city);
        expect(assetsWithCity.length).toEqual(body.length);
        const cities = new Set(assetsWithCity.map((asset) => asset.exifInfo.city));
        expect(cities.size).toEqual(body.length);
      }
    });
  });

  describe('GET /search/suggestions', () => {
    it('should get suggestions for country (including null)', async () => {
      const { status, body } = await request(app)
        .get('/search/suggestions?type=country&includeNull=true')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toEqual([
        'Cuba',
        'France',
        'Georgia',
        'Germany',
        'Ghana',
        'Japan',
        'Morocco',
        "People's Republic of China",
        'Russian Federation',
        'Singapore',
        'Spain',
        'Switzerland',
        'United States of America',
        null,
      ]);
      expect(status).toBe(200);
    });

    it('should get suggestions for country', async () => {
      const { status, body } = await request(app)
        .get('/search/suggestions?type=country')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toEqual([
        'Cuba',
        'France',
        'Georgia',
        'Germany',
        'Ghana',
        'Japan',
        'Morocco',
        "People's Republic of China",
        'Russian Federation',
        'Singapore',
        'Spain',
        'Switzerland',
        'United States of America',
      ]);
      expect(status).toBe(200);
    });

    it('should get suggestions for state (including null)', async () => {
      const { status, body } = await request(app)
        .get('/search/suggestions?type=state&includeNull=true')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toEqual([
        'Andalusia',
        'Glarus',
        'Greater Accra',
        'Havana',
        'Île-de-France',
        'Marrakesh-Safi',
        'Mississippi',
        'New York',
        'Shanghai',
        'State of Berlin',
        'St.-Petersburg',
        'Tbilisi',
        'Tokyo',
        'Virginia',
        null,
      ]);
      expect(status).toBe(200);
    });

    it('should get suggestions for state', async () => {
      const { status, body } = await request(app)
        .get('/search/suggestions?type=state')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toEqual([
        'Andalusia',
        'Glarus',
        'Greater Accra',
        'Havana',
        'Île-de-France',
        'Marrakesh-Safi',
        'Mississippi',
        'New York',
        'Shanghai',
        'State of Berlin',
        'St.-Petersburg',
        'Tbilisi',
        'Tokyo',
        'Virginia',
      ]);
      expect(status).toBe(200);
    });

    it('should get suggestions for city (including null)', async () => {
      const { status, body } = await request(app)
        .get('/search/suggestions?type=city&includeNull=true')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toEqual([
        'Accra',
        'Berlin',
        'Glarus',
        'Havana',
        'Marrakesh',
        'Montalbán de Córdoba',
        'New York City',
        'Novena',
        'Paris',
        'Philadelphia',
        'Saint Petersburg',
        'Shanghai',
        'Stanley',
        'Tbilisi',
        'Tokyo',
        null,
      ]);
      expect(status).toBe(200);
    });

    it('should get suggestions for city', async () => {
      const { status, body } = await request(app)
        .get('/search/suggestions?type=city')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toEqual([
        'Accra',
        'Berlin',
        'Glarus',
        'Havana',
        'Marrakesh',
        'Montalbán de Córdoba',
        'New York City',
        'Novena',
        'Paris',
        'Philadelphia',
        'Saint Petersburg',
        'Shanghai',
        'Stanley',
        'Tbilisi',
        'Tokyo',
      ]);
      expect(status).toBe(200);
    });

    it('should get suggestions for camera make (including null)', async () => {
      const { status, body } = await request(app)
        .get('/search/suggestions?type=camera-make&includeNull=true')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toEqual([
        'Apple',
        'Canon',
        'FUJIFILM',
        'NIKON CORPORATION',
        'PENTAX Corporation',
        'samsung',
        'SONY',
        null,
      ]);
      expect(status).toBe(200);
    });

    it('should get suggestions for camera make', async () => {
      const { status, body } = await request(app)
        .get('/search/suggestions?type=camera-make')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toEqual([
        'Apple',
        'Canon',
        'FUJIFILM',
        'NIKON CORPORATION',
        'PENTAX Corporation',
        'samsung',
        'SONY',
      ]);
      expect(status).toBe(200);
    });

    it('should get suggestions for camera model (including null)', async () => {
      const { status, body } = await request(app)
        .get('/search/suggestions?type=camera-model&includeNull=true')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toEqual([
        'Canon EOS 7D',
        'Canon EOS R5',
        'DSLR-A550',
        'FinePix S3Pro',
        'iPhone 7',
        'NIKON D700',
        'NIKON D750',
        'NIKON D80',
        'PENTAX K10D',
        'SM-F711N',
        'SM-S906U',
        'SM-T970',
        null,
      ]);
      expect(status).toBe(200);
    });

    it('should get suggestions for camera model', async () => {
      const { status, body } = await request(app)
        .get('/search/suggestions?type=camera-model')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toEqual([
        'Canon EOS 7D',
        'Canon EOS R5',
        'DSLR-A550',
        'FinePix S3Pro',
        'iPhone 7',
        'NIKON D700',
        'NIKON D750',
        'NIKON D80',
        'PENTAX K10D',
        'SM-F711N',
        'SM-S906U',
        'SM-T970',
      ]);
      expect(status).toBe(200);
    });
  });

  // -- Timeline EXIF filter tests --
  // Note: EXIF data (city, country, make, model) is populated by the server's metadata
  // extraction and reverse geocoding pipeline during asset upload. The test assets used
  // in the beforeAll block above have embedded EXIF data and assigned GPS coordinates,
  // so the server has already populated their exif_info rows by the time tests run.

  describe('GET /timeline/buckets (EXIF filters)', () => {
    it('should return buckets without any filter', async () => {
      const { status, body } = await request(app)
        .get('/timeline/buckets')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      for (const bucket of body) {
        expect(bucket).toHaveProperty('timeBucket');
        expect(bucket).toHaveProperty('count');
        expect(bucket.count).toBeGreaterThan(0);
      }
    });

    it('should filter buckets by city', async () => {
      // Paris is assigned to assetFalcon via reverse geocoding of its coordinates
      const { status, body } = await request(app)
        .get('/timeline/buckets?city=Paris')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);

      const totalFiltered = body.reduce((sum: number, b: { count: number }) => sum + b.count, 0);
      // There should be at least 1 asset in Paris
      expect(totalFiltered).toBeGreaterThanOrEqual(1);

      // Filtered count should be less than unfiltered
      const { body: allBuckets } = await request(app)
        .get('/timeline/buckets')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      const totalAll = allBuckets.reduce((sum: number, b: { count: number }) => sum + b.count, 0);
      expect(totalFiltered).toBeLessThan(totalAll);
    });

    it('should filter buckets by camera make', async () => {
      // Canon is the make for assetFalcon (Canon EOS R5) and assetDenali (Canon EOS 7D)
      const { status, body } = await request(app)
        .get('/timeline/buckets?make=Canon')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);

      const totalFiltered = body.reduce((sum: number, b: { count: number }) => sum + b.count, 0);
      expect(totalFiltered).toBeGreaterThanOrEqual(2);
    });

    it('should filter buckets by camera model', async () => {
      const { status, body } = await request(app)
        .get('/timeline/buckets?model=Canon%20EOS%207D')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);

      const totalFiltered = body.reduce((sum: number, b: { count: number }) => sum + b.count, 0);
      // Only assetDenali has Canon EOS 7D
      expect(totalFiltered).toBeGreaterThanOrEqual(1);
    });

    it('should filter buckets by country', async () => {
      const { status, body } = await request(app)
        .get('/timeline/buckets?country=France')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);

      const totalFiltered = body.reduce((sum: number, b: { count: number }) => sum + b.count, 0);
      expect(totalFiltered).toBeGreaterThanOrEqual(1);
    });

    it('should return zero buckets for non-matching city filter', async () => {
      const { status, body } = await request(app)
        .get('/timeline/buckets?city=Timbuktu')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(0);
    });

    it('should return zero buckets for non-matching make filter', async () => {
      const { status, body } = await request(app)
        .get('/timeline/buckets?make=Hasselblad')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(0);
    });

    it('should combine city and make filters (AND semantics)', async () => {
      // Paris + Canon: assetFalcon is in Paris with Canon EOS R5
      const { status, body } = await request(app)
        .get('/timeline/buckets?city=Paris&make=Canon')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);

      const totalFiltered = body.reduce((sum: number, b: { count: number }) => sum + b.count, 0);
      expect(totalFiltered).toBeGreaterThanOrEqual(1);

      // AND should be ≤ each individual filter
      const { body: cityOnly } = await request(app)
        .get('/timeline/buckets?city=Paris')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      const cityCount = cityOnly.reduce((sum: number, b: { count: number }) => sum + b.count, 0);
      expect(totalFiltered).toBeLessThanOrEqual(cityCount);
    });

    it('should return zero when combined filters match no assets', async () => {
      // Tokyo + Canon: assetDenali (Canon EOS 7D) is in Tokyo — this should match
      // But Accra + Canon: no Canon camera in Accra
      const { status, body } = await request(app)
        .get('/timeline/buckets?city=Accra&make=Canon')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);

      const totalFiltered = body.reduce((sum: number, b: { count: number }) => sum + b.count, 0);
      expect(totalFiltered).toBe(0);
    });

    it('should accept the rating filter parameter', async () => {
      // rating filter uses >= semantics; test assets may not have ratings set,
      // so we just verify the API accepts it and returns a valid response
      const { status, body } = await request(app)
        .get('/timeline/buckets?rating=5')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      // With no rated assets, expect empty; with rated ones, expect valid structure
      for (const bucket of body) {
        expect(bucket).toHaveProperty('timeBucket');
        expect(bucket).toHaveProperty('count');
      }
    });

    it('should accept the type filter parameter', async () => {
      const { status, body } = await request(app)
        .get('/timeline/buckets?type=IMAGE')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);

      const totalImages = body.reduce((sum: number, b: { count: number }) => sum + b.count, 0);
      expect(totalImages).toBeGreaterThan(0);
    });
  });

  describe('GET /search/suggestions (spaceId scoping)', () => {
    let space: SharedSpaceResponseDto;
    let nonOwnerUser: LoginResponseDto;

    beforeAll(async () => {
      // Create a space and add only the Paris asset (assetFalcon) to it.
      // assetFalcon is in Paris, France and was taken with a Canon EOS R5.
      space = await utils.createSpace(admin.accessToken, { name: 'Paris Photos' });
      await utils.addSpaceAssets(admin.accessToken, space.id, [assetFalcon.id]);

      nonOwnerUser = await utils.userSetup(admin.accessToken, {
        email: 'space-filter-test@immich.cloud',
        name: 'Space Filter User',
        password: 'Password123!',
      });
      await utils.addSpaceMember(admin.accessToken, space.id, { userId: nonOwnerUser.userId });
    });

    it('should return only countries from the specified space', async () => {
      const { status, body } = await request(app)
        .get(`/search/suggestions?type=country&spaceId=${space.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      // Only France should appear since only the Paris asset is in the space
      expect(body).toEqual(['France']);
    });

    it('should return only cities from the specified space', async () => {
      const { status, body } = await request(app)
        .get(`/search/suggestions?type=city&spaceId=${space.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toEqual(['Paris']);
    });

    it('should return only camera makes from the specified space', async () => {
      const { status, body } = await request(app)
        .get(`/search/suggestions?type=camera-make&spaceId=${space.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toEqual(['Canon']);
    });

    it('should return only camera models from the specified space', async () => {
      const { status, body } = await request(app)
        .get(`/search/suggestions?type=camera-model&spaceId=${space.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toEqual(['Canon EOS R5']);
    });

    it('should return all countries when spaceId is omitted', async () => {
      const { status, body } = await request(app)
        .get('/search/suggestions?type=country')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      // Without space scoping, all countries should be returned
      expect(body.length).toBeGreaterThan(1);
      expect(body).toContain('France');
    });

    it('should return empty for space with no matching suggestion type', async () => {
      // Create a space with only the density_plot asset (PNG, no camera make/model)
      const emptySpace = await utils.createSpace(admin.accessToken, { name: 'Density Only' });
      await utils.addSpaceAssets(admin.accessToken, emptySpace.id, [assetDensity.id]);

      const { status, body } = await request(app)
        .get(`/search/suggestions?type=camera-make&spaceId=${emptySpace.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      // density_plot.png has no camera make EXIF data
      expect(body).toEqual([]);
    });

    it('should return suggestions for non-owner space member', async () => {
      // nonOwnerUser doesn't own the Paris asset, but is a space member
      const { status, body } = await request(app)
        .get(`/search/suggestions?type=country&spaceId=${space.id}`)
        .set('Authorization', `Bearer ${nonOwnerUser.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual(['France']);
    });

    it('should return camera suggestions for non-owner space member', async () => {
      const { status, body } = await request(app)
        .get(`/search/suggestions?type=camera-make&spaceId=${space.id}`)
        .set('Authorization', `Bearer ${nonOwnerUser.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual(['Canon']);
    });

    it('should reject non-member requesting space suggestions', async () => {
      const outsider = await utils.userSetup(admin.accessToken, {
        email: 'space-outsider@immich.cloud',
        name: 'Outsider',
        password: 'Password123!',
      });
      const { status } = await request(app)
        .get(`/search/suggestions?type=country&spaceId=${space.id}`)
        .set('Authorization', `Bearer ${outsider.accessToken}`);
      expect(status).toBe(400);
    });
  });

  describe('POST /search/random (spaceId access)', () => {
    let space: SharedSpaceResponseDto;
    let outsider: LoginResponseDto;

    beforeAll(async () => {
      space = await utils.createSpace(admin.accessToken, { name: 'Random Search Space' });
      await utils.addSpaceAssets(admin.accessToken, space.id, [assetFalcon.id]);

      outsider = await utils.userSetup(admin.accessToken, {
        email: 'random-search-outsider@immich.cloud',
        name: 'Random Outsider',
        password: 'Password123!',
      });
    });

    it('should reject non-member', async () => {
      const { status } = await request(app)
        .post('/search/random')
        .set('Authorization', `Bearer ${outsider.accessToken}`)
        .send({ spaceId: space.id });

      expect(status).toBe(400);
    });

    it('should return results for space member', async () => {
      const { status, body } = await request(app)
        .post('/search/random')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ spaceId: space.id, size: 10 });

      expect(status).toBe(200);
      expect(body.length).toBeGreaterThan(0);
      expect(body.map((a: AssetResponseDto) => a.id)).toContain(assetFalcon.id);
    });
  });

  describe('POST /search/large-assets (spaceId access)', () => {
    let space: SharedSpaceResponseDto;
    let outsider: LoginResponseDto;

    beforeAll(async () => {
      space = await utils.createSpace(admin.accessToken, { name: 'Large Assets Search Space' });
      await utils.addSpaceAssets(admin.accessToken, space.id, [assetFalcon.id]);

      outsider = await utils.userSetup(admin.accessToken, {
        email: 'large-assets-outsider@immich.cloud',
        name: 'Large Assets Outsider',
        password: 'Password123!',
      });
    });

    it('should reject non-member', async () => {
      const { status } = await request(app)
        .post(`/search/large-assets?spaceId=${space.id}`)
        .set('Authorization', `Bearer ${outsider.accessToken}`);

      expect(status).toBe(400);
    });

    it('should return results for space member', async () => {
      const { status, body } = await request(app)
        .post(`/search/large-assets?spaceId=${space.id}&size=10`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
    });
  });

  describe('POST /search/smart with spacePersonIds', () => {
    it('should return 400 when spacePersonIds sent without spaceId', async () => {
      const { status } = await request(app)
        .post('/search/smart')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ query: 'test', spacePersonIds: [admin.userId] });

      expect(status).toBe(400);
    });

    it('should not reject spacePersonIds when spaceId is provided', async () => {
      const space = await utils.createSpace(admin.accessToken, { name: 'Search PersonIds Test' });
      const asset = await utils.createAsset(admin.accessToken);
      await utils.addSpaceAssets(admin.accessToken, space.id, [asset.id]);

      const { status, body } = await request(app)
        .post('/search/smart')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ query: 'test', spaceId: space.id, spacePersonIds: [admin.userId] });

      // 200 if ML enabled, 400 "Smart search is not enabled" if ML disabled
      // but never 400 "spacePersonIds requires spaceId" — that's the validation we're testing
      if (status === 400) {
        expect(body.message).toBe('Smart search is not enabled');
      } else {
        expect(status).toBe(200);
      }
    });

    it('should not reject structured filters within a space', async () => {
      const space = await utils.createSpace(admin.accessToken, { name: 'Filter Test Space' });
      const asset = await utils.createAsset(admin.accessToken);
      await utils.addSpaceAssets(admin.accessToken, space.id, [asset.id]);

      const { status, body } = await request(app)
        .post('/search/smart')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          query: 'test',
          spaceId: space.id,
          city: 'NonexistentCity',
          rating: 5,
        });

      if (status === 400) {
        expect(body.message).toBe('Smart search is not enabled');
      } else {
        expect(status).toBe(200);
      }
    });
  });
  describe('GET /search/suggestions (temporal scoping)', () => {
    // Upload assets with specific fileCreatedAt dates and different countries/cameras
    // so we can test that temporal params narrow suggestions correctly.
    let temporalUser: LoginResponseDto;
    let temporalSpace: SharedSpaceResponseDto;
    let temporalWebsocket: Socket;

    // Dates: asset1 = 2020-06-15, asset2 = 2022-03-10, asset3 = 2024-01-20
    const date1 = '2020-06-15T12:00:00.000Z';
    const date2 = '2022-03-10T12:00:00.000Z';
    const date3 = '2024-01-20T12:00:00.000Z';

    let asset1: AssetMediaResponseDto;
    let asset2: AssetMediaResponseDto;
    let asset3: AssetMediaResponseDto;

    beforeAll(async () => {
      temporalUser = await utils.userSetup(admin.accessToken, {
        email: 'temporal-suggest@immich.cloud',
        name: 'Temporal Suggest User',
        password: 'Password123!',
      });
      temporalWebsocket = await utils.connectWebsocket(temporalUser.accessToken);

      // Upload three assets with distinct dates — they'll use random PNG images with no EXIF,
      // so we assign GPS coords afterwards to get country/city populated by reverse geocoding.
      asset1 = await utils.createAsset(temporalUser.accessToken, {
        deviceAssetId: 'temporal-1',
        fileCreatedAt: date1,
        fileModifiedAt: date1,
      });
      asset2 = await utils.createAsset(temporalUser.accessToken, {
        deviceAssetId: 'temporal-2',
        fileCreatedAt: date2,
        fileModifiedAt: date2,
      });
      asset3 = await utils.createAsset(temporalUser.accessToken, {
        deviceAssetId: 'temporal-3',
        fileCreatedAt: date3,
        fileModifiedAt: date3,
      });

      for (const a of [asset1, asset2, asset3]) {
        await utils.waitForWebsocketEvent({ event: 'assetUpload', id: a.id });
      }

      // Assign different GPS coordinates so reverse geocoding gives distinct countries
      const updates = [
        { id: asset1.id, latitude: 48.8534, longitude: 2.3488 }, // Paris, France
        { id: asset2.id, latitude: 35.6895, longitude: 139.6917 }, // Tokyo, Japan
        { id: asset3.id, latitude: 52.5244, longitude: 13.4105 }, // Berlin, Germany
      ];
      await Promise.all(
        updates.map((u) =>
          updateAsset(
            { id: u.id, updateAssetDto: { latitude: u.latitude, longitude: u.longitude } },
            { headers: asBearerAuth(temporalUser.accessToken) },
          ),
        ),
      );
      for (const u of updates) {
        await utils.waitForWebsocketEvent({ event: 'assetUpdate', id: u.id });
      }

      // Create a space with all three assets for combined testing
      temporalSpace = await utils.createSpace(temporalUser.accessToken, { name: 'Temporal Test Space' });
      await utils.addSpaceAssets(temporalUser.accessToken, temporalSpace.id, [asset1.id, asset2.id, asset3.id]);
    }, 30_000);

    afterAll(() => {
      utils.disconnectWebsocket(temporalWebsocket);
    });

    it('should return only countries from assets in the date range', async () => {
      // Range covers only asset1 (2020-06-15) and asset2 (2022-03-10)
      const { status, body } = await request(app)
        .get(
          '/search/suggestions?type=country&takenAfter=2020-01-01T00:00:00.000Z&takenBefore=2023-01-01T00:00:00.000Z',
        )
        .set('Authorization', `Bearer ${temporalUser.accessToken}`);
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toContain('France');
      expect(body).toContain('Japan');
      expect(body).not.toContain('Germany');
    });

    it('should return only cities from assets in the date range', async () => {
      // Range covers only asset3 (2024-01-20)
      const { status, body } = await request(app)
        .get('/search/suggestions?type=city&takenAfter=2023-01-01T00:00:00.000Z&takenBefore=2025-01-01T00:00:00.000Z')
        .set('Authorization', `Bearer ${temporalUser.accessToken}`);
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toContain('Berlin');
      expect(body).not.toContain('Paris');
      expect(body).not.toContain('Tokyo');
    });

    it('should return empty when date range contains no assets', async () => {
      const { status, body } = await request(app)
        .get(
          '/search/suggestions?type=country&takenAfter=2000-01-01T00:00:00.000Z&takenBefore=2001-01-01T00:00:00.000Z',
        )
        .set('Authorization', `Bearer ${temporalUser.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual([]);
    });

    it('should apply strict < for takenBefore boundary', async () => {
      // takenBefore is the exact fileCreatedAt of asset1 — should NOT include it (strict <)
      const { status, body } = await request(app)
        .get(`/search/suggestions?type=country&takenAfter=2020-01-01T00:00:00.000Z&takenBefore=${date1}`)
        .set('Authorization', `Bearer ${temporalUser.accessToken}`);
      expect(status).toBe(200);
      // asset1 fileCreatedAt is exactly date1, strict < means it's excluded
      expect(body).not.toContain('France');
    });

    it('should combine spaceId with temporal params', async () => {
      // All three assets are in the space, but date range only covers asset2 (2022)
      const { status, body } = await request(app)
        .get(
          `/search/suggestions?type=country&spaceId=${temporalSpace.id}&takenAfter=2021-01-01T00:00:00.000Z&takenBefore=2023-01-01T00:00:00.000Z`,
        )
        .set('Authorization', `Bearer ${temporalUser.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual(['Japan']);
    });

    it('should return all suggestions when no temporal params are provided (backward compat)', async () => {
      const { status, body } = await request(app)
        .get('/search/suggestions?type=country')
        .set('Authorization', `Bearer ${temporalUser.accessToken}`);
      expect(status).toBe(200);
      expect(body).toContain('France');
      expect(body).toContain('Japan');
      expect(body).toContain('Germany');
    });
  });
});
