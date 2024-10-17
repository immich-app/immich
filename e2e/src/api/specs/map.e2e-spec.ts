import { LoginResponseDto } from '@immich/sdk';
import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { Socket } from 'socket.io-client';
import { errorDto } from 'src/responses';
import { app, testAssetDir, utils } from 'src/utils';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('/map', () => {
  let websocket: Socket;
  let admin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup({ onboarding: false });

    websocket = await utils.connectWebsocket(admin.accessToken);

    const files = ['formats/heic/IMG_2682.heic', 'metadata/gps-position/thompson-springs.jpg'];
    utils.resetEvents();
    const uploadFile = async (input: string) => {
      const filepath = join(testAssetDir, input);
      const { id } = await utils.createAsset(admin.accessToken, {
        assetData: { bytes: await readFile(filepath), filename: basename(filepath) },
      });
      await utils.waitForWebsocketEvent({ event: 'assetUpload', id });
    };
    await Promise.all(files.map((f) => uploadFile(f)));
  });

  afterAll(() => {
    utils.disconnectWebsocket(websocket);
  });

  describe('GET /map/markers', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/map/markers');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    // TODO archive one of these assets
    it('should get map markers for all non-archived assets', async () => {
      const { status, body } = await request(app)
        .get('/map/markers')
        .query({ isArchived: false })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toHaveLength(2);
      expect(body).toEqual([
        {
          city: 'Palisade',
          country: 'United States of America',
          id: expect.any(String),
          lat: expect.closeTo(39.115),
          lon: expect.closeTo(-108.400_968),
          state: 'Colorado',
        },
        {
          city: 'Ralston',
          country: 'United States of America',
          id: expect.any(String),
          lat: expect.closeTo(41.2203),
          lon: expect.closeTo(-96.071_625),
          state: 'Nebraska',
        },
      ]);
    });

    // TODO archive one of these assets
    it('should get all map markers', async () => {
      const { status, body } = await request(app)
        .get('/map/markers')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual([
        {
          city: 'Palisade',
          country: 'United States of America',
          id: expect.any(String),
          lat: expect.closeTo(39.115),
          lon: expect.closeTo(-108.400_968),
          state: 'Colorado',
        },
        {
          city: 'Ralston',
          country: 'United States of America',
          id: expect.any(String),
          lat: expect.closeTo(41.2203),
          lon: expect.closeTo(-96.071_625),
          state: 'Nebraska',
        },
      ]);
    });
  });

  describe('GET /map/reverse-geocode', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/map/reverse-geocode');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should throw an error if a lat is not provided', async () => {
      const { status, body } = await request(app)
        .get('/map/reverse-geocode?lon=123')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['lat must be a number between -90 and 90']));
    });

    it('should throw an error if a lat is not a number', async () => {
      const { status, body } = await request(app)
        .get('/map/reverse-geocode?lat=abc&lon=123.456')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['lat must be a number between -90 and 90']));
    });

    it('should throw an error if a lat is out of range', async () => {
      const { status, body } = await request(app)
        .get('/map/reverse-geocode?lat=91&lon=123.456')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['lat must be a number between -90 and 90']));
    });

    it('should throw an error if a lon is not provided', async () => {
      const { status, body } = await request(app)
        .get('/map/reverse-geocode?lat=75')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['lon must be a number between -180 and 180']));
    });

    const reverseGeocodeTestCases = [
      {
        name: 'Vaucluse',
        lat: -33.858_977_058_663_13,
        lon: 151.278_490_730_270_48,
        results: [{ city: 'Vaucluse', state: 'New South Wales', country: 'Australia' }],
      },
      {
        name: 'Ravenhall',
        lat: -37.765_732_399_174_75,
        lon: 144.752_453_164_883_3,
        results: [{ city: 'Ravenhall', state: 'Victoria', country: 'Australia' }],
      },
      {
        name: 'Scarborough',
        lat: -31.894_346_156_789_997,
        lon: 115.757_617_103_904_64,
        results: [{ city: 'Scarborough', state: 'Western Australia', country: 'Australia' }],
      },
    ];

    it.each(reverseGeocodeTestCases)(`should resolve to $name`, async ({ lat, lon, results }) => {
      const { status, body } = await request(app)
        .get(`/map/reverse-geocode?lat=${lat}&lon=${lon}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(results.length);
      expect(body).toEqual(results);
    });
  });
});
