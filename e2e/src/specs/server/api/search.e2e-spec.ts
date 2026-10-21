import {
  AssetMediaResponseDto,
  AssetOrder,
  AssetResponseDto,
  AssetTypeEnum,
  AssetVisibility,
  deleteAssets,
  LoginResponseDto,
  MetadataSearchDto,
  SearchFilter,
  SearchOrderField,
  SharedLinkType,
  updateAsset,
} from '@immich/sdk';
import { DateTime } from 'luxon';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Socket } from 'socket.io-client';
import { app, asBearerAuth, TEN_TIMES, testAssetDir, utils } from 'src/utils.js';
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
      { latitude: 48.85341, longitude: 2.3488 }, // paris
      { latitude: 35.6895, longitude: 139.69171 }, // tokyo
      { latitude: 52.52437, longitude: 13.41053 }, // berlin
      { latitude: 1.3146631, longitude: 103.8454093 }, // singapore
      { latitude: 41.01384, longitude: 28.94966 }, // istanbul
      { latitude: 5.55602, longitude: -0.1969 }, // accra
      { latitude: 37.5442706, longitude: -4.7277528 }, // andalusia
      { latitude: 23.13302, longitude: -82.38304 }, // havana
      { latitude: 41.69411, longitude: 44.83368 }, // tbilisi
      { latitude: 31.22222, longitude: 121.45806 }, // shanghai
      { latitude: 38.9711, longitude: -109.7137 }, // thompson springs
      { latitude: 40.71427, longitude: -74.00597 }, // new york
      { latitude: 47.04057, longitude: 9.06804 }, // glarus
      { latitude: 32.77152, longitude: -89.11673 }, // philadelphia
      { latitude: 31.63416, longitude: -7.99994 }, // marrakesh
      { latitude: 38.5237354, longitude: -78.4886194 }, // tanners ridge
      { latitude: 59.93863, longitude: 30.31413 }, // st. petersburg
      { latitude: 0, longitude: 0 }, // null island
    ];

    const updates = coordinates.map((dto, i) =>
      updateAsset({ id: assets[i].id, updateAssetDto: dto }, { headers: asBearerAuth(admin.accessToken) }),
    );

    await Promise.all(updates);
    for (const i of coordinates.keys()) {
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
    const searchTests: { should: string; deferred: () => { dto: MetadataSearchDto; assets: { id: string }[] } }[] = [
      {
        should: 'should get my assets',
        deferred: () => ({ dto: { size: 1 }, assets: [assetLast] }),
      },
      {
        should: 'should sort my assets in reverse',
        deferred: () => ({
          dto: { orderBy: { field: SearchOrderField.FileCreatedAt, direction: AssetOrder.Asc }, size: 2 },
          assets: [assetCyclamen, assetNotocactus],
        }),
      },
      {
        should: 'should search by checksum (base64)',
        deferred: () => ({
          dto: { filter: { checksum: { eq: '9IXBDMjj9OrQb+1YMHprZJgZ/UQ=' } } },
          assets: [assetCyclamen],
        }),
      },
      {
        should: 'should search by checksum (hex)',
        deferred: () => ({
          dto: { filter: { checksum: { eq: 'f485c10cc8e3f4ead06fed58307a6b649819fd44' } } },
          assets: [assetCyclamen],
        }),
      },
      {
        should: 'should search by id',
        deferred: () => ({ dto: { filter: { id: { eq: assetCyclamen.id } } }, assets: [assetCyclamen] }),
      },
      {
        should: 'should search by isFavorite (true)',
        deferred: () => ({ dto: { filter: { isFavorite: { eq: true } } }, assets: [assetCyclamen] }),
      },
      {
        should: 'should search by isFavorite (false)',
        deferred: () => ({ dto: { size: 1, filter: { isFavorite: { eq: false } } }, assets: [assetLast] }),
      },
      {
        should: 'should search by visibility (AssetVisibility.Archive)',
        deferred: () => ({
          dto: { filter: { visibility: { eq: AssetVisibility.Archive } } },
          assets: [assetSprings],
        }),
      },
      {
        should: 'should search by visibility (AssetVisibility.Timeline)',
        deferred: () => ({
          dto: { size: 1, filter: { visibility: { eq: AssetVisibility.Timeline } } },
          assets: [assetLast],
        }),
      },
      {
        should: 'should search by type (image)',
        deferred: () => ({ dto: { size: 1, filter: { type: { eq: AssetTypeEnum.Image } } }, assets: [assetLast] }),
      },
      {
        should: 'should search by type (video)',
        deferred: () => ({
          dto: { filter: { type: { eq: AssetTypeEnum.Video }, visibility: { eq: AssetVisibility.Hidden } } },
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
        deferred: () => ({
          dto: { filter: { trashedAt: { lte: today.plus({ hour: 1 }).toISO() } } },
          assets: [assetSilver],
        }),
      },
      {
        should: 'should search by trashedBefore (no results)',
        deferred: () => ({ dto: { filter: { trashedAt: { lte: today.minus({ days: 1 }).toISO() } } }, assets: [] }),
      },
      {
        should: 'should search by trashedAfter',
        deferred: () => ({
          dto: { filter: { trashedAt: { gte: today.minus({ hour: 1 }).toISO() } } },
          assets: [assetSilver],
        }),
      },
      {
        should: 'should search by trashedAfter (no results)',
        deferred: () => ({ dto: { filter: { trashedAt: { gte: today.plus({ hour: 1 }).toISO() } } }, assets: [] }),
      },
      {
        should: 'should search by takenBefore',
        deferred: () => ({
          dto: { size: 1, filter: { takenAt: { lte: today.plus({ hour: 1 }).toISO() } } },
          assets: [assetLast],
        }),
      },
      {
        should: 'should search by takenBefore (no results)',
        deferred: () => ({
          dto: { filter: { takenAt: { lte: DateTime.fromObject({ year: 1234 }).toJSDate().toISOString() } } },
          assets: [],
        }),
      },
      {
        should: 'should search by takenAfter',
        deferred: () => ({
          dto: { size: 1, filter: { takenAt: { gte: DateTime.fromObject({ year: 1234 }).toJSDate().toISOString() } } },
          assets: [assetLast],
        }),
      },
      {
        should: 'should search by takenAfter (no results)',
        deferred: () => ({ dto: { filter: { takenAt: { gte: today.plus({ hour: 1 }).toISO() } } }, assets: [] }),
      },
      {
        should: 'should search by originalFilename',
        deferred: () => ({ dto: { filter: { originalFileName: { like: 'rocks' } } }, assets: [assetRocks] }),
      },
      {
        should: 'should search by originalFilename with spaces',
        deferred: () => ({
          dto: { filter: { originalFileName: { like: 'samsung-one' }, type: { eq: AssetTypeEnum.Image } } },
          assets: [assetOneJpg5, assetOneJpg6, assetOneHeic6],
        }),
      },
      {
        should: 'should search by city',
        deferred: () => ({ dto: { filter: { city: { eq: 'Accra' } } }, assets: [assetHeic] }),
      },
      {
        should: 'should search city (null)',
        deferred: () => ({
          dto: { filter: { city: { eq: null }, visibility: { eq: AssetVisibility.Timeline } } },
          assets: [assetLast],
        }),
      },
      {
        should: 'should search by state',
        deferred: () => ({ dto: { filter: { state: { eq: 'New York' } } }, assets: [assetDensity] }),
      },
      {
        should: 'should search state (null)',
        deferred: () => ({
          dto: { filter: { state: { eq: null }, visibility: { eq: AssetVisibility.Timeline } } },
          assets: [assetLast, assetNotocactus],
        }),
      },
      {
        should: 'should search by country',
        deferred: () => ({ dto: { filter: { country: { eq: 'France' } } }, assets: [assetFalcon] }),
      },
      {
        should: 'should search country (null)',
        deferred: () => ({
          dto: { filter: { country: { eq: null }, visibility: { eq: AssetVisibility.Timeline } } },
          assets: [assetLast],
        }),
      },
      {
        should: 'should search by make',
        deferred: () => ({ dto: { filter: { make: { eq: 'Canon' } } }, assets: [assetFalcon, assetDenali] }),
      },
      {
        should: 'should search by model',
        deferred: () => ({ dto: { filter: { model: { eq: 'Canon EOS 7D' } } }, assets: [assetDenali] }),
      },
      {
        should: 'should allow searching the upload library (libraryId: null)',
        deferred: () => ({ dto: { size: 1, filter: { libraryId: { eq: null } } }, assets: [assetLast] }),
      },
    ];

    for (const { should, deferred } of searchTests) {
      it(should, async () => {
        const { assets, dto } = deferred();
        // the flat search excluded trashed assets by default, the structured filter has to ask for it
        const filter: SearchFilter = { trashedAt: { eq: null }, ...dto.filter };
        const { status, body } = await request(app)
          .post('/search/metadata')
          .send({ ...dto, filter })
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

    it('should support pagination', async () => {
      const dto = {
        filter: { trashedAt: { eq: null } },
        orderBy: { field: SearchOrderField.FileCreatedAt, direction: AssetOrder.Asc },
        size: 1,
      };
      const firstPage = await request(app)
        .post('/search/metadata')
        .send(dto)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(firstPage.status).toBe(200);
      expect(firstPage.body.assets.items).toEqual([expect.objectContaining({ id: assetCyclamen.id })]);

      const { status, body } = await request(app)
        .post('/search/metadata')
        .send({ ...dto, cursor: firstPage.body.assets.nextCursor })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body.assets.items).toEqual([expect.objectContaining({ id: assetNotocactus.id })]);
    });

    it('should reject shared link access without an album filter', async () => {
      const album = await utils.createAlbum(admin.accessToken, { albumName: 'foo' });
      const sharedLink = await utils.createSharedLink(admin.accessToken, {
        type: SharedLinkType.Album,
        albumId: album.id,
      });
      const { status, body } = await request(app).post(`/search/metadata?key=${sharedLink.key}`).send({ filter: {} });
      expect(status).toBe(400);
      expect(body).toEqual({ message: 'Shared link access is only allowed in combination with an albumIds filter' });
    });

    it('should allow shared link access for albums', async () => {
      const asset = await utils.createAsset(admin.accessToken);
      const album = await utils.createAlbum(admin.accessToken, { albumName: 'foo', assetIds: [asset.id] });
      const sharedLink = await utils.createSharedLink(admin.accessToken, {
        type: SharedLinkType.Album,
        albumId: album.id,
      });

      const { status, body } = await request(app)
        .post(`/search/metadata?key=${sharedLink.key}`)
        .send({ filter: { albumIds: { any: [album.id] } } });
      expect(status).toBe(200);
      expect(body.assets.items).toEqual([expect.objectContaining({ id: asset.id })]);
    });

    it('should strip metadata for a shared link without metadata', async () => {
      const asset = await utils.createAsset(admin.accessToken);
      const album = await utils.createAlbum(admin.accessToken, { albumName: 'foo', assetIds: [asset.id] });
      const sharedLink = await utils.createSharedLink(admin.accessToken, {
        type: SharedLinkType.Album,
        albumId: album.id,
        showMetadata: false,
      });

      const { status, body } = await request(app)
        .post(`/search/metadata?key=${sharedLink.key}`)
        .send({ filter: { albumIds: { any: [album.id] } }, withExif: true });
      expect(status).toBe(200);
      expect(body.assets.items).toHaveLength(1);
      expect(body.assets.items[0]).toEqual(expect.objectContaining({ id: asset.id, hasMetadata: false }));
      expect(body.assets.items[0]).not.toHaveProperty('exifInfo');
      expect(body.assets.items[0]).not.toHaveProperty('originalPath');
      expect(body.assets.items[0]).not.toHaveProperty('originalFileName');
      expect(body.assets.items[0]).not.toHaveProperty('ownerId');
    });
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
      expect(Array.isArray(body)).toBe(true);
      expect(body).toEqual(expect.arrayContaining([{ fieldName: 'exifInfo.city', items: [] }]));
      expect(body).toEqual(
        expect.arrayContaining([
          {
            fieldName: 'createdAt',
            items: expect.arrayContaining([
              expect.objectContaining({ data: expect.objectContaining({ id: assetLast.id }) }),
            ]),
          },
        ]),
      );
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
        expect(body[0].name).toEqual(expect.stringContaining(name));
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
        'China',
        'Cuba',
        'France',
        'Georgia',
        'Germany',
        'Ghana',
        'Japan',
        'Morocco',
        'Russia',
        'Singapore',
        'Spain',
        'Switzerland',
        'United States',
        null,
      ]);
      expect(status).toBe(200);
    });

    it('should get suggestions for country', async () => {
      const { status, body } = await request(app)
        .get('/search/suggestions?type=country')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toEqual([
        'China',
        'Cuba',
        'France',
        'Georgia',
        'Germany',
        'Ghana',
        'Japan',
        'Morocco',
        'Russia',
        'Singapore',
        'Spain',
        'Switzerland',
        'United States',
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
});
