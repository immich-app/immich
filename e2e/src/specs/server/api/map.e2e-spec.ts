import { AssetVisibility, LoginResponseDto } from '@immich/sdk';
import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { Socket } from 'socket.io-client';
import { createUserDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, testAssetDir, utils } from 'src/utils';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('/map', () => {
  let websocket: Socket;
  let partnerWebsocket: Socket;
  let admin: LoginResponseDto;
  let partner: LoginResponseDto;
  let partnerArchivedAssetId: string;
  let adminArchivedAssetId: string;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup({ onboarding: false });
    partner = await utils.userSetup(admin.accessToken, createUserDto.user1);

    websocket = await utils.connectWebsocket(admin.accessToken);
    partnerWebsocket = await utils.connectWebsocket(partner.accessToken);

    const adminFiles = ['formats/heic/IMG_2682.heic', 'metadata/gps-position/thompson-springs.jpg'];
    const adminArchivedFile = 'metadata/dates/datetimeoriginal-gps.jpg';
    const partnerFile = 'metadata/gps-position/thompson-springs.jpg';
    utils.resetEvents();
    const uploadFile = async (accessToken: string, input: string) => {
      const filepath = join(testAssetDir, input);
      const { id } = await utils.createAsset(accessToken, {
        assetData: { bytes: await readFile(filepath), filename: basename(filepath) },
      });
      await utils.waitForWebsocketEvent({ event: 'assetUpload', id });
      return id;
    };
    await Promise.all(adminFiles.map((f) => uploadFile(admin.accessToken, f)));
    [adminArchivedAssetId, partnerArchivedAssetId] = await Promise.all([
      uploadFile(admin.accessToken, adminArchivedFile),
      uploadFile(partner.accessToken, partnerFile),
    ]);

    await Promise.all([
      utils.archiveAssets(admin.accessToken, [adminArchivedAssetId]),
      utils.archiveAssets(partner.accessToken, [partnerArchivedAssetId]),
      utils.createPartner(partner.accessToken, admin.userId),
    ]);
  });

  afterAll(() => {
    utils.disconnectWebsocket(websocket);
    utils.disconnectWebsocket(partnerWebsocket);
  });

  describe('GET /map/markers', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/map/markers');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should get map markers for all non-archived assets', async () => {
      const { status, body } = await request(app)
        .get('/map/markers')
        .query({ visibility: AssetVisibility.Timeline })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toHaveLength(2);
      expect(body).toEqual([
        {
          city: 'Palisade',
          country: 'United States of America',
          id: expect.any(String),
          lat: expect.closeTo(39.115),
          lon: expect.closeTo(-108.400968),
          state: 'Colorado',
        },
        {
          city: 'Ralston',
          country: 'United States of America',
          id: expect.any(String),
          lat: expect.closeTo(41.2203),
          lon: expect.closeTo(-96.071625),
          state: 'Nebraska',
        },
      ]);
    });

    it('should not expose partner archived asset locations', async () => {
      const { status, body } = await request(app)
        .get('/map/markers')
        .query({ withPartners: true, isArchived: true })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      const ids = body.map((m: { id: string }) => m.id);
      expect(ids).not.toContain(partnerArchivedAssetId);
      expect(ids).toContain(adminArchivedAssetId);
    });

    it('should include own archived asset locations', async () => {
      const { status, body } = await request(app)
        .get('/map/markers')
        .query({ isArchived: true })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body.map((m: { id: string }) => m.id)).toContain(adminArchivedAssetId);
    });

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
          lon: expect.closeTo(-108.400968),
          state: 'Colorado',
        },
        {
          city: 'Ralston',
          country: 'United States of America',
          id: expect.any(String),
          lat: expect.closeTo(41.2203),
          lon: expect.closeTo(-96.071625),
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
      expect(body).toEqual(
        errorDto.validationError([{ path: ['lat'], message: 'Invalid input: expected number, received NaN' }]),
      );
    });

    it('should throw an error if a lat is not a number', async () => {
      const { status, body } = await request(app)
        .get('/map/reverse-geocode?lat=abc&lon=123.456')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.validationError([{ path: ['lat'], message: 'Invalid input: expected number, received NaN' }]),
      );
    });

    it('should throw an error if a lat is out of range', async () => {
      const { status, body } = await request(app)
        .get('/map/reverse-geocode?lat=91&lon=123.456')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.validationError([{ path: ['lat'], message: 'Too big: expected number to be <=90' }]),
      );
    });

    it('should throw an error if a lon is not provided', async () => {
      const { status, body } = await request(app)
        .get('/map/reverse-geocode?lat=75')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.validationError([{ path: ['lon'], message: 'Invalid input: expected number, received NaN' }]),
      );
    });

    const reverseGeocodeTestCases = [
      {
        name: 'Vaucluse',
        lat: -33.85897705866313,
        lon: 151.27849073027048,
        results: [{ city: 'Vaucluse', state: 'New South Wales', country: 'Australia' }],
      },
      {
        name: 'Ravenhall',
        lat: -37.76573239917475,
        lon: 144.7524531648833,
        results: [{ city: 'Ravenhall', state: 'Victoria', country: 'Australia' }],
      },
      {
        name: 'Scarborough',
        lat: -31.894346156789997,
        lon: 115.75761710390464,
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
