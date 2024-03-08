import { AssetFileUploadResponseDto, LoginResponseDto } from '@immich/sdk';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Socket } from 'socket.io-client';
import { errorDto } from 'src/responses';
import { app, testAssetDir, utils } from 'src/utils';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const albums = { total: 0, count: 0, items: [], facets: [] };

describe('/search', () => {
  let admin: LoginResponseDto;
  let assetFalcon: AssetFileUploadResponseDto;
  let assetDenali: AssetFileUploadResponseDto;
  let websocket: Socket;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    websocket = await utils.connectWebsocket(admin.accessToken);

    const files: string[] = [
      '/albums/nature/prairie_falcon.jpg',
      '/formats/webp/denali.webp',
      '/formats/raw/Nikon/D700/philadelphia.nef',
      '/albums/nature/orychophragmus_violaceus.jpg',
      '/albums/nature/notocactus_minimus.jpg',
      '/albums/nature/silver_fir.jpg',
      '/albums/nature/tanners_ridge.jpg',
      '/albums/nature/cyclamen_persicum.jpg',
      '/albums/nature/polemonium_reptans.jpg',
      '/albums/nature/wood_anemones.jpg',
      '/formats/heic/IMG_2682.heic',
      '/formats/jpg/el_torcal_rocks.jpg',
      '/formats/png/density_plot.png',
      '/formats/motionphoto/Samsung One UI 6.jpg',
      '/formats/motionphoto/Samsung One UI 6.heic',
      '/formats/motionphoto/Samsung One UI 5.jpg',
      '/formats/raw/Nikon/D80/glarus.nef',
      '/metadata/gps-position/thompson-springs.jpg',
    ];
    const assets: AssetFileUploadResponseDto[] = [];
    for (const filename of files) {
      const bytes = await readFile(join(testAssetDir, filename));
      assets.push(
        await utils.createAsset(admin.accessToken, {
          deviceAssetId: `test-${filename}`,
          assetData: { bytes, filename },
        }),
      );
    }

    for (const asset of assets) {
      await utils.waitForWebsocketEvent({ event: 'upload', assetId: asset.id });
    }

    [assetFalcon, assetDenali] = assets;
  });

  afterAll(async () => {
    await utils.disconnectWebsocket(websocket);
  });

  describe('POST /search/metadata', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/search/metadata');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should search by camera make', async () => {
      const { status, body } = await request(app)
        .post('/search/metadata')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ make: 'Canon' });
      expect(status).toBe(200);
      expect(body).toEqual({
        albums,
        assets: {
          count: 2,
          items: expect.arrayContaining([
            expect.objectContaining({ id: assetDenali.id }),
            expect.objectContaining({ id: assetFalcon.id }),
          ]),
          facets: [],
          nextPage: null,
          total: 2,
        },
      });
    });

    it('should search by camera model', async () => {
      const { status, body } = await request(app)
        .post('/search/metadata')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ model: 'Canon EOS 7D' });
      expect(status).toBe(200);
      expect(body).toEqual({
        albums,
        assets: {
          count: 1,
          items: [expect.objectContaining({ id: assetDenali.id })],
          facets: [],
          nextPage: null,
          total: 1,
        },
      });
    });
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

    it('should get places', async () => {
      const { status, body } = await request(app)
        .get('/search/places?name=Paris')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(10);
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
      expect(body).toEqual(['United States of America']);
      expect(status).toBe(200);
    });

    it('should get suggestions for state', async () => {
      const { status, body } = await request(app)
        .get('/search/suggestions?type=state')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toEqual(['Douglas County, Nebraska', 'Mesa County, Colorado']);
      expect(status).toBe(200);
    });

    it('should get suggestions for city', async () => {
      const { status, body } = await request(app)
        .get('/search/suggestions?type=city')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toEqual(['Palisade', 'Ralston']);
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
