import { AssetMediaResponseDto, LoginResponseDto, SharedLinkType } from '@immich/sdk';
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
  let admin: LoginResponseDto;
  let nonAdmin: LoginResponseDto;
  let asset: AssetMediaResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup({ onboarding: false });
    nonAdmin = await utils.userSetup(admin.accessToken, createUserDto.user1);

    websocket = await utils.connectWebsocket(admin.accessToken);

    asset = await utils.createAsset(admin.accessToken);

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

  describe('GET /map/style.json', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/map/style.json');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should allow shared link access', async () => {
      const sharedLink = await utils.createSharedLink(admin.accessToken, {
        type: SharedLinkType.Individual,
        assetIds: [asset.id],
      });
      const { status, body } = await request(app).get(`/map/style.json?key=${sharedLink.key}`).query({ theme: 'dark' });

      expect(status).toBe(200);
      expect(body).toEqual(expect.objectContaining({ id: 'immich-map-dark' }));
    });

    it('should throw an error if a theme is not light or dark', async () => {
      for (const theme of ['dark1', true, 123, '', null, undefined]) {
        const { status, body } = await request(app)
          .get('/map/style.json')
          .query({ theme })
          .set('Authorization', `Bearer ${admin.accessToken}`);
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest(['theme must be one of the following values: light, dark']));
      }
    });

    it('should return the light style.json', async () => {
      const { status, body } = await request(app)
        .get('/map/style.json')
        .query({ theme: 'light' })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual(expect.objectContaining({ id: 'immich-map-light' }));
    });

    it('should return the dark style.json', async () => {
      const { status, body } = await request(app)
        .get('/map/style.json')
        .query({ theme: 'dark' })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual(expect.objectContaining({ id: 'immich-map-dark' }));
    });

    it('should not require admin authentication', async () => {
      const { status, body } = await request(app)
        .get('/map/style.json')
        .query({ theme: 'dark' })
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual(expect.objectContaining({ id: 'immich-map-dark' }));
    });
  });
});
