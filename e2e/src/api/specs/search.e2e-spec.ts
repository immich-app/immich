import { AssetFileUploadResponseDto, LoginResponseDto, deleteAssets, getMapMarkers, updateAsset } from '@immich/sdk';
import { DateTime } from 'luxon';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Socket } from 'socket.io-client';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, testAssetDir, utils } from 'src/utils';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
const today = DateTime.now();

describe('/search', () => {
  let admin: LoginResponseDto;
  let websocket: Socket;

  let assetFalcon: AssetFileUploadResponseDto;
  let assetDenali: AssetFileUploadResponseDto;
  let assetCyclamen: AssetFileUploadResponseDto;
  let assetNotocactus: AssetFileUploadResponseDto;
  let assetSilver: AssetFileUploadResponseDto;
  let assetDensity: AssetFileUploadResponseDto;
  // let assetPhiladelphia: AssetFileUploadResponseDto;
  // let assetOrychophragmus: AssetFileUploadResponseDto;
  // let assetRidge: AssetFileUploadResponseDto;
  // let assetPolemonium: AssetFileUploadResponseDto;
  // let assetWood: AssetFileUploadResponseDto;
  // let assetGlarus: AssetFileUploadResponseDto;
  let assetHeic: AssetFileUploadResponseDto;
  let assetRocks: AssetFileUploadResponseDto;
  let assetOneJpg6: AssetFileUploadResponseDto;
  let assetOneHeic6: AssetFileUploadResponseDto;
  let assetOneJpg5: AssetFileUploadResponseDto;
  let assetSprings: AssetFileUploadResponseDto;
  let assetLast: AssetFileUploadResponseDto;
  let cities: string[];
  let states: string[];
  let countries: string[];

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
      { filename: '/formats/motionphoto/Samsung One UI 6.jpg' },
      { filename: '/formats/motionphoto/Samsung One UI 6.heic' },
      { filename: '/formats/motionphoto/Samsung One UI 5.jpg' },

      { filename: '/metadata/gps-position/thompson-springs.jpg', dto: { isArchived: true } },

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
    const assets: AssetFileUploadResponseDto[] = [];
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
      { latitude: 63.0695, longitude: -151.0074 }, // denali
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
      { latitude: 35.6895, longitude: 139.691_71 }, // tokyo
    ];

    const updates = assets.map((asset, i) =>
      updateAsset({ id: asset.id, updateAssetDto: coordinates[i] }, { headers: asBearerAuth(admin.accessToken) }),
    );

    await Promise.all(updates);
    for (const asset of assets) {
      await utils.waitForWebsocketEvent({ event: 'assetUpdate', id: asset.id });
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

    assetLast = assets.at(-1) as AssetFileUploadResponseDto;

    await deleteAssets({ assetBulkDeleteDto: { ids: [assetSilver.id] } }, { headers: asBearerAuth(admin.accessToken) });

    const mapMarkers = await getMapMarkers({}, { headers: asBearerAuth(admin.accessToken) });
    const nonTrashed = mapMarkers.filter((mark) => mark.id !== assetSilver.id);
    cities = [...new Set(nonTrashed.map((mark) => mark.city).filter((entry): entry is string => !!entry))].sort();
    states = [...new Set(nonTrashed.map((mark) => mark.state).filter((entry): entry is string => !!entry))].sort();
    countries = [...new Set(nonTrashed.map((mark) => mark.country).filter((entry): entry is string => !!entry))].sort();
  }, 30_000);

  afterAll(async () => {
    utils.disconnectWebsocket(websocket);
  });

  describe('POST /search/metadata', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/search/metadata');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    const badTests = [
      {
        should: 'should reject page as a string',
        dto: { page: 'abc' },
        expected: ['page must not be less than 1', 'page must be an integer number'],
      },
      {
        should: 'should reject page as a decimal',
        dto: { page: 1.5 },
        expected: ['page must be an integer number'],
      },
      {
        should: 'should reject page as a negative number',
        dto: { page: -10 },
        expected: ['page must not be less than 1'],
      },
      {
        should: 'should reject page as 0',
        dto: { page: 0 },
        expected: ['page must not be less than 1'],
      },
      {
        should: 'should reject size as a string',
        dto: { size: 'abc' },
        expected: [
          'size must not be greater than 1000',
          'size must not be less than 1',
          'size must be an integer number',
        ],
      },
      {
        should: 'should reject an invalid size',
        dto: { size: -1.5 },
        expected: ['size must not be less than 1', 'size must be an integer number'],
      },
      ...['isArchived', 'isFavorite', 'isEncoded', 'isMotion', 'isOffline', 'isVisible'].map((value) => ({
        should: `should reject ${value} not a boolean`,
        dto: { [value]: 'immich' },
        expected: [`${value} must be a boolean value`],
      })),
    ];

    for (const { should, dto, expected } of badTests) {
      it(should, async () => {
        const { status, body } = await request(app)
          .post('/search/metadata')
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send(dto);
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest(expected));
      });
    }

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
        should: 'should search by isArchived (true)',
        deferred: () => ({ dto: { isArchived: true }, assets: [assetSprings] }),
      },
      {
        should: 'should search by isArchived (false)',
        deferred: () => ({ dto: { size: 1, isArchived: false }, assets: [assetLast] }),
      },
      {
        should: 'should search by type (image)',
        deferred: () => ({ dto: { size: 1, type: 'IMAGE' }, assets: [assetLast] }),
      },
      {
        should: 'should search by type (video)',
        deferred: () => ({
          dto: { type: 'VIDEO' },
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
      //   {
      //     should: 'should search by originalPath',
      //     deferred: () => ({
      //       dto: { originalPath: asset1.originalPath },
      //       assets: [asset1],
      //     }),
      //   },
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
          dto: { originalFileName: 'Samsung One', type: 'IMAGE' },
          assets: [assetOneJpg5, assetOneJpg6, assetOneHeic6],
        }),
      },
      {
        should: 'should search by city',
        deferred: () => ({ dto: { city: 'Accra' }, assets: [assetHeic] }),
      },
      {
        should: 'should search by state',
        deferred: () => ({ dto: { state: 'New York' }, assets: [assetDensity] }),
      },
      {
        should: 'should search by country',
        deferred: () => ({ dto: { country: 'France' }, assets: [assetFalcon] }),
      },
      {
        should: 'should search by make',
        deferred: () => ({ dto: { make: 'Canon' }, assets: [assetFalcon, assetDenali] }),
      },
      {
        should: 'should search by model',
        deferred: () => ({ dto: { model: 'Canon EOS 7D' }, assets: [assetDenali] }),
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

  describe('POST /search/smart', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/search/smart');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });
  });

  describe('GET /search/explore', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/search/explore');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should get explore data', async () => {
      const { status, body } = await request(app)
        .get('/search/explore')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual([
        { fieldName: 'exifInfo.city', items: [] },
        { fieldName: 'smartInfo.tags', items: [] },
      ]);
    });
  });

  describe('GET /search/places', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/search/places');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

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
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/search/cities');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

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
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/search/suggestions');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should get suggestions for country', async () => {
      const { status, body } = await request(app)
        .get('/search/suggestions?type=country')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toEqual(countries);
      expect(status).toBe(200);
    });

    it('should get suggestions for state', async () => {
      const { status, body } = await request(app)
        .get('/search/suggestions?type=state')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toHaveLength(states.length);
      expect(body).toEqual(expect.arrayContaining(states));
      expect(status).toBe(200);
    });

    it('should get suggestions for city', async () => {
      const { status, body } = await request(app)
        .get('/search/suggestions?type=city')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toEqual(cities);
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
});
