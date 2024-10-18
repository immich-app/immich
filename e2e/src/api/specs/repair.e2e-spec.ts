import { LibraryResponseDto, LoginResponseDto, getAllLibraries, scanLibrary } from '@immich/sdk';
import { readFile } from 'fs/promises';
import { Socket } from 'socket.io-client';
import { userDto, uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, testAssetDir, testAssetDirInternal, utils } from 'src/utils';
import request from 'supertest';
import { utimes } from 'utimes';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { b } from 'vitest/dist/chunks/suite.BMWOKiTe.js';

const scan = async (accessToken: string, id: string) => scanLibrary({ id }, { headers: asBearerAuth(accessToken) });

describe('/repair', () => {
  let admin: LoginResponseDto;
  let user: LoginResponseDto;
  let library: LibraryResponseDto;
  let websocket: Socket;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    await utils.resetAdminConfig(admin.accessToken);
    user = await utils.userSetup(admin.accessToken, userDto.user1);
    library = await utils.createLibrary(admin.accessToken, { ownerId: admin.userId });
    websocket = await utils.connectWebsocket(admin.accessToken);
  });

  afterAll(() => {
    utils.disconnectWebsocket(websocket);
    utils.resetTempFolder();
  });

  beforeEach(() => {
    utils.resetEvents();
  });

  describe('POST /check', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/libraries').send({});
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require admin authentication', async () => {
      const { status, body } = await request(app)
        .post('/repair/check')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ ownerId: admin.userId });

      expect(status).toBe(403);
      expect(body).toEqual(errorDto.forbidden);
    });

    it('should detect a changed original file', async () => {
      const asset = await utils.createAsset(admin.accessToken, {
        assetData: {
          filename: 'polemonium_reptans.jpg',
          bytes: await readFile(`${testAssetDir}/albums/nature/polemonium_reptans.jpg`),
        },
      });

      await utils.waitForWebsocketEvent({ event: 'assetUpload', id: asset.id });

      let assetPath = '';
      {
        const { status, body } = await request(app)
          .get(`/assets/${asset.id}`)
          .set('Authorization', `Bearer ${admin.accessToken}`);
        expect(status).toBe(200);
        assetPath = body.originalPath;
      }

      utils.flipBitInFile(assetPath, 2, 5);

      const { status, body } = await request(app)
        .post('/repair/check')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ ownerId: admin.userId });

      expect(status).toBe(201);
      expect(body).toEqual(
        expect.arrayContaining([
        expect.objectContaining({
          ownerId: admin.userId,
          name: 'New External Library',
          refreshedAt: null,
          assetCount: 0,
          importPaths: [],
          exclusionPatterns: expect.any(Array),
        }),
      ]);
    });
  });
});
