import { getMyUser, LoginResponseDto } from '@immich/sdk';
import { createHash, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { request as httpRequest } from 'node:http';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { Socket } from 'socket.io-client';
import { createUserDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, baseUrl, testAssetDir, utils } from 'src/utils';
import { serializeDictionary } from 'structured-headers';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

function makeAssetData(overrides?: Partial<Record<string, unknown>>) {
  return serializeDictionary({
    filename: 'test-image.jpg',
    'device-asset-id': 'rufh',
    'device-id': 'test',
    'file-created-at': new Date('2025-01-02T00:00:00Z').toISOString(),
    'file-modified-at': new Date('2025-01-01T00:00:00Z').toISOString(),
    'is-favorite': true,
    'icloud-id': 'example-icloud-id',
    ...overrides,
  });
}

describe('/upload', () => {
  let websocket: Socket;
  let admin: LoginResponseDto;
  let user: LoginResponseDto;
  let quotaUser: LoginResponseDto;
  let cancelQuotaUser: LoginResponseDto;

  let assetData: string;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup({ onboarding: false });
    websocket = await utils.connectWebsocket(admin.accessToken);
    user = await utils.userSetup(admin.accessToken, createUserDto.user1);
    cancelQuotaUser = await utils.userSetup(admin.accessToken, createUserDto.user2);
    quotaUser = await utils.userSetup(admin.accessToken, createUserDto.userQuota);
    assetData = makeAssetData();
  });

  afterAll(() => {
    utils.disconnectWebsocket(websocket);
  });

  describe('startUpload', () => {
    it('should require auth', async () => {
      const content = randomBytes(1024);

      const { status, headers } = await request(app)
        .post('/upload')
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', `sha=:${createHash('sha1').update(content).digest('base64')}:`)
        .set('Upload-Complete', '?1')
        .set('Content-Type', 'image/jpeg')
        .set('Upload-Length', '1024')
        .send(content);

      expect(status).toBe(401);
      expect(headers['location']).toBeUndefined();
    });

    it('should create a complete upload with Upload-Complete: ?1', async () => {
      const assetData = makeAssetData({ filename: 'el_torcal_rocks.jpg' });
      const content = await readFile(join(testAssetDir, 'formats/jpg/el_torcal_rocks.jpg'));

      const { status, headers, body } = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', `sha=:${createHash('sha1').update(content).digest('base64')}:`)
        .set('Upload-Complete', '?1')
        .set('Content-Type', 'image/jpeg')
        .set('Upload-Length', content.byteLength.toString())
        .send(content);

      expect(status).toBe(200);
      expect(headers['upload-complete']).toBe('?1');
      expect(body).toEqual(expect.objectContaining({ id: expect.any(String) }));

      await utils.waitForWebsocketEvent({ event: 'assetUpload', id: body.id });
      const asset = await utils.getAssetInfo(admin.accessToken, body.id);
      expect(asset).toEqual(
        expect.objectContaining({
          id: body.id,
          ownerId: admin.userId,
          exifInfo: expect.objectContaining({ fileSizeInByte: content.byteLength }),
          originalFileName: 'el_torcal_rocks.jpg',
          deviceAssetId: 'rufh',
          deviceId: 'test',
          isFavorite: true,
          visibility: 'timeline',
        }),
      );
    });

    it('should create a complete upload with Upload-Incomplete: ?0 if version is 3', async () => {
      const content = randomBytes(1024);

      const checksum = createHash('sha1').update(content).digest('base64');
      const { status, headers, body } = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '3')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', `sha=:${checksum}:`)
        .set('Upload-Incomplete', '?0')
        .set('Content-Type', 'image/jpeg')
        .set('Upload-Length', '1024')
        .send(content);

      expect(status).toBe(200);
      expect(headers['upload-incomplete']).toBe('?0');
      expect(body).toEqual(expect.objectContaining({ id: expect.any(String) }));

      const asset = await utils.getAssetInfo(user.accessToken, body.id);
      expect(asset).toEqual(
        expect.objectContaining({
          id: body.id,
          checksum,
          ownerId: user.userId,
          exifInfo: expect.objectContaining({ fileSizeInByte: content.byteLength }),
          originalFileName: 'test-image.jpg',
          deviceAssetId: 'rufh',
          deviceId: 'test',
          isFavorite: true,
          visibility: 'timeline',
        }),
      );
    });

    it('should reject when Upload-Complete: ?1 with mismatching Content-Length and Upload-Length', async () => {
      const content = randomBytes(1000);

      const { status, headers, body } = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', `sha=:${createHash('sha1').update(content).digest('base64')}:`)
        .set('Upload-Complete', '?1')
        .set('Upload-Length', '2000')
        .set('Content-Length', '1000')
        .send(content);

      expect(status).toBe(400);
      expect(headers['content-type']).toBe('application/problem+json; charset=utf-8');
      expect(body).toEqual({
        type: 'https://iana.org/assignments/http-problem-types#inconsistent-upload-length',
        title: 'inconsistent length values for upload',
      });
    });

    it('should create an incomplete upload with Upload-Complete: ?0', async () => {
      const partialContent = randomBytes(512);

      const { status, headers } = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', `sha=:${createHash('sha1').update(partialContent).digest('base64')}:`)
        .set('Upload-Complete', '?0')
        .set('Content-Length', '512')
        .set('Upload-Length', '513')
        .send(partialContent);

      expect(status).toBe(201);
      expect(headers['location']).toMatch(/^\/api\/upload\/[a-zA-Z0-9-]+$/);
      expect(headers['upload-complete']).toBe('?0');
    });

    it('should create an incomplete upload with Upload-Incomplete: ?1 if version is 3', async () => {
      const partialContent = randomBytes(512);

      const { status, headers } = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '3')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', `sha=:${createHash('sha1').update(partialContent).digest('base64')}:`)
        .set('Upload-Incomplete', '?1')
        .set('Content-Length', '512')
        .set('Upload-Length', '513')
        .send(partialContent);

      expect(status).toBe(201);
      expect(headers['location']).toMatch(/^\/api\/upload\/[a-zA-Z0-9-]+$/);
      expect(headers['upload-incomplete']).toBe('?1');
    });

    it('should reject attempt to upload completed asset', async () => {
      const content = randomBytes(1024);

      const firstRequest = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', `sha=:${createHash('sha1').update(content).digest('base64')}:`)
        .set('Upload-Complete', '?1')
        .set('Content-Type', 'image/jpeg')
        .set('Upload-Length', '1024')
        .send(content);

      expect(firstRequest.status).toBe(200);
      expect(firstRequest.headers['upload-complete']).toBe('?1');

      const secondRequest = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', `sha=:${createHash('sha1').update(content).digest('base64')}:`)
        .set('Upload-Complete', '?1')
        .set('Content-Type', 'image/jpeg')
        .set('Upload-Length', '1024')
        .send(content);

      expect(secondRequest.status).toBe(400);
      expect(secondRequest.headers['content-type']).toBe('application/problem+json; charset=utf-8');
      expect(secondRequest.body).toEqual({
        type: 'https://iana.org/assignments/http-problem-types#completed-upload',
        title: 'upload is already completed',
      });
    });

    // TODO: find a way to test interim responses
    it('should return 500 if existing incomplete asset', async () => {
      const content = randomBytes(1024);

      const firstRequest = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', `sha=:${createHash('sha1').update(content).digest('base64')}:`)
        .set('Upload-Complete', '?0')
        .set('Content-Type', 'image/jpeg')
        .set('Upload-Length', '1024')
        .send(content);

      expect(firstRequest.status).toBe(201);
      expect(firstRequest.headers['upload-complete']).toBe('?0');
      expect(firstRequest.headers['location']).toMatch(/^\/api\/upload\/[a-zA-Z0-9-]+$/);

      const secondRequest = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', `sha=:${createHash('sha1').update(content).digest('base64')}:`)
        .set('Upload-Complete', '?1')
        .set('Content-Type', 'image/jpeg')
        .set('Upload-Length', '1024')
        .send();

      expect(secondRequest.status).toBe(500);
      expect(secondRequest.text).toEqual('Incomplete asset already exists');
    });

    it('should reject asset with mismatching checksum', async () => {
      const content = randomBytes(1024);

      const { status, headers, text } = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', `sha=:${createHash('sha1').update('').digest('base64')}:`)
        .set('Upload-Complete', '?1')
        .set('Content-Type', 'image/jpeg')
        .set('Upload-Length', '1024')
        .send(content);

      expect(status).toBe(460);
      expect(headers['location']).toBeUndefined();
      expect(text).toBe('File on server does not match provided checksum');
    });

    it('should update the used quota', async () => {
      const content = randomBytes(500);

      const { status, headers } = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${quotaUser.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', `sha=:${createHash('sha1').update(content).digest('base64')}:`)
        .set('Upload-Complete', '?1')
        .set('Content-Type', 'image/jpeg')
        .set('Upload-Length', '500')
        .send(content);

      expect(status).toBe(200);
      expect(headers['upload-complete']).toBe('?1');

      const userData = await getMyUser({ headers: asBearerAuth(quotaUser.accessToken) });

      expect(userData).toEqual(expect.objectContaining({ quotaUsageInBytes: 500 }));
    });

    it('should not upload an asset if it would exceed the quota', async () => {
      const { body, status } = await request(app)
        .post('/assets')
        .set('Authorization', `Bearer ${quotaUser.accessToken}`)
        .field('deviceAssetId', 'example-image')
        .field('deviceId', 'e2e')
        .field('fileCreatedAt', new Date().toISOString())
        .field('fileModifiedAt', new Date().toISOString())
        .attach('assetData', randomBytes(13), 'example.jpg');

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Quota has been exceeded!'));
    });
  });

  describe('resumeUpload', () => {
    let uploadResource: string;
    let chunks: Buffer[];
    let checksum: string;

    beforeAll(async () => {
      // Create an incomplete upload
      const assetData = makeAssetData({ filename: '8bit-sRGB.jxl' });
      const fullContent = await readFile(join(testAssetDir, 'formats/jxl/8bit-sRGB.jxl'));
      chunks = [
        fullContent.subarray(0, 10_000),
        fullContent.subarray(10_000, 100_000),
        fullContent.subarray(100_000, fullContent.length),
      ];
      checksum = createHash('sha1').update(fullContent).digest('base64');
      const response = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', `sha=:${checksum}:`)
        .set('Upload-Complete', '?0')
        .set('Upload-Length', '1780777')
        .send(chunks[0]);

      uploadResource = response.headers['location'];
    });

    it('should require auth', async () => {
      const { status, headers } = await request(baseUrl)
        .patch(uploadResource)
        .set('Upload-Draft-Interop-Version', '8')
        .set('Upload-Offset', chunks[0].length.toString())
        .set('Upload-Complete', '?1')
        .set('Content-Type', 'application/partial-upload')
        .send(chunks[1]);

      expect(status).toBe(401);
      expect(headers['upload-complete']).toBeUndefined();
    });

    it("should reject upload to another user's asset", async () => {
      const { status, headers } = await request(baseUrl)
        .patch(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('Upload-Offset', chunks[0].length.toString())
        .set('Upload-Complete', '?1')
        .set('Content-Type', 'application/partial-upload')
        .send(chunks[1]);

      expect(status).toBe(404);
      expect(headers['upload-complete']).toEqual('?0');
    });

    it('should append data with correct offset', async () => {
      const { status, headers } = await request(baseUrl)
        .patch(uploadResource)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('Upload-Offset', '10000')
        .set('Upload-Complete', '?0')
        .set('Content-Type', 'application/partial-upload')
        .send(chunks[1]);

      expect(status).toBe(204);
      expect(headers['upload-complete']).toBe('?0');

      const headResponse = await request(baseUrl)
        .head(uploadResource)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8');

      expect(headResponse.headers['upload-offset']).toBe('100000');
    });

    it('should reject append with different upload length than before', async () => {
      const { status, headers, body } = await request(baseUrl)
        .patch(uploadResource)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('Upload-Offset', '100000')
        .set('Upload-Complete', '?0')
        .set('Upload-Length', '100000') // should be 1780777
        .set('Content-Type', 'application/partial-upload')
        .send();

      expect(status).toBe(400);
      expect(headers['content-type']).toBe('application/problem+json; charset=utf-8');
      expect(body).toEqual({
        type: 'https://iana.org/assignments/http-problem-types#inconsistent-upload-length',
        title: 'inconsistent length values for upload',
      });
    });

    it('should reject append with mismatching length', async () => {
      const { status, headers, body } = await request(baseUrl)
        .patch(uploadResource)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('Upload-Offset', '10000')
        .set('Upload-Complete', '?0')
        .set('Content-Type', 'application/partial-upload')
        .send(randomBytes(100));

      expect(status).toBe(409);
      expect(headers['upload-offset']).toBe('100000');
      expect(headers['content-type']).toBe('application/problem+json; charset=utf-8');
      expect(body).toEqual({
        type: 'https://iana.org/assignments/http-problem-types#mismatching-upload-offset',
        title: 'offset from request does not match offset of resource',
        'expected-offset': 100_000,
        'provided-offset': 10_000,
      });
    });

    it('should complete upload with Upload-Complete: ?1', async () => {
      const headResponse = await request(baseUrl)
        .head(uploadResource)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8');

      const offset = Number.parseInt(headResponse.headers['upload-offset']);
      expect(offset).toBe(100_000);

      const { status, headers, body } = await request(baseUrl)
        .patch(uploadResource)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('Upload-Offset', offset.toString())
        .set('Upload-Complete', '?1')
        .set('Content-Type', 'application/partial-upload')
        .send(chunks[2]);

      expect(status).toBe(200);
      expect(headers['upload-complete']).toBe('?1');

      const id = uploadResource.replace('/api/upload/', '');
      expect(body).toEqual(expect.objectContaining({ id }));

      await utils.waitForWebsocketEvent({ event: 'assetUpload', id: body.id });
      const asset = await utils.getAssetInfo(admin.accessToken, id);
      expect(asset).toEqual(
        expect.objectContaining({
          id,
          checksum,
          ownerId: admin.userId,
          exifInfo: expect.objectContaining({ fileSizeInByte: 1_780_777 }),
          originalFileName: '8bit-sRGB.jxl',
          deviceAssetId: 'rufh',
          deviceId: 'test',
          isFavorite: true,
          visibility: 'timeline',
        }),
      );
    });

    it('should reject append to completed upload', async () => {
      const { status, headers, body } = await request(baseUrl)
        .patch(uploadResource)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('Upload-Offset', '2750')
        .set('Upload-Complete', '?0')
        .set('Content-Type', 'application/partial-upload')
        .send(randomBytes(100));

      expect(status).toBe(400);
      expect(headers['content-type']).toBe('application/problem+json; charset=utf-8');
      expect(body).toEqual({
        type: 'https://iana.org/assignments/http-problem-types#completed-upload',
        title: 'upload is already completed',
      });
    });

    it('should handle resume with offset retrieval', async () => {
      const totalContent = randomBytes(5000);
      const firstPart = totalContent.subarray(0, 2000);

      const initialResponse = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', `sha=:${createHash('sha1').update(totalContent).digest('base64')}:`)
        .set('Upload-Complete', '?0')
        .set('Upload-Length', '5000')
        .send(firstPart);
      expect(initialResponse.status).toBe(201);
      const uploadResource = initialResponse.headers['location'];

      const offsetResponse = await request(baseUrl)
        .head(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8');
      expect(offsetResponse.headers['upload-offset']).toBe('2000');

      const remainingContent = totalContent.subarray(2000);
      const resumeResponse = await request(baseUrl)
        .patch(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('Upload-Offset', '2000')
        .set('Upload-Complete', '?1')
        .set('Content-Type', 'application/partial-upload')
        .send(remainingContent);

      expect(resumeResponse.status).toBe(200);
      expect(resumeResponse.headers['upload-complete']).toBe('?1');
    });

    it('should handle multiple chunks', async () => {
      const chunks = [randomBytes(2000), randomBytes(3000), randomBytes(5000)];
      const hash = createHash('sha1');
      for (const chunk of chunks) {
        hash.update(chunk);
      }

      const createResponse = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', `sha=:${hash.digest('base64')}:`)
        .set('Upload-Complete', '?0')
        .set('Upload-Length', '10000')
        .send(chunks[0]);

      const uploadResource = createResponse.headers['location'];
      let currentOffset = 2000;

      let response = await request(baseUrl)
        .patch(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('Upload-Offset', currentOffset.toString())
        .set('Upload-Complete', '?0')
        .set('Content-Type', 'application/partial-upload')
        .send(chunks[1]);

      expect(response.status).toBe(204);
      currentOffset += 3000;

      const offsetCheck = await request(baseUrl)
        .head(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8');

      expect(offsetCheck.headers['upload-offset']).toBe('5000');

      response = await request(baseUrl)
        .patch(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('Upload-Offset', currentOffset.toString())
        .set('Upload-Complete', '?1')
        .set('Content-Type', 'application/partial-upload')
        .send(chunks[2]);

      expect(response.status).toBe(200);
      expect(response.headers['upload-complete']).toBe('?1');
    });

    it('should abort previous request on new request for same asset', async () => {
      const content = randomBytes(10000);
      const checksum = createHash('sha1').update(content).digest('base64');

      const createResponse = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', `sha=:${checksum}:`)
        .set('Upload-Complete', '?0')
        .set('Upload-Length', '10000')
        .send();

      expect(createResponse.status).toBe(201);
      const uploadResource = createResponse.headers['location'];
      expect(uploadResource).toBeDefined();

      // simulate interrupted upload by starting a request and not completing it
      const didAbort = new Promise<boolean>((resolve, reject) => {
        const req = httpRequest(
          {
            hostname: 'localhost',
            port: 2285,
            path: uploadResource,
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
              'Upload-Draft-Interop-Version': '8',
              'X-Immich-Asset-Data': assetData,
              'Repr-Digest': `sha=:${checksum}:`,
              'Upload-Complete': '?1',
              'Upload-Length': '10000',
              'Content-Length': '10000',
              'Upload-Offset': '0',
              'Content-Type': 'application/partial-upload',
            },
          },
          (res) => res.on('close', () => resolve(false)),
        );

        req.on('error', (err) => {
          console.log('First request error:', err.message);
          if (err.message === 'socket hang up') {
            resolve(true);
          } else {
            reject(err);
          }
        });

        req.write(content.subarray(0, 2000));
      });

      await setTimeout(50);

      const headResponse = await request(baseUrl)
        .head(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8');

      expect(headResponse.status).toBe(204);
      expect(headResponse.headers['upload-offset']).toBe('2000');
      expect(headResponse.headers['upload-complete']).toBe('?0');

      expect(await didAbort).toBe(true);

      const secondResponse = await request(baseUrl)
        .patch(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', `sha=:${checksum}:`)
        .set('Upload-Complete', '?1')
        .set('Upload-Length', '10000')
        .set('Content-Type', 'application/partial-upload')
        .set('Upload-Offset', '2000')
        .send(content.subarray(2000));

      expect(secondResponse.status).toBe(200);
    });
  });

  describe('cancelUpload', () => {
    let uploadResource: string;

    beforeAll(async () => {
      const content = randomBytes(200);
      // Create an incomplete upload
      const response = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', `sha=:${createHash('sha1').update(content).digest('base64')}:`)
        .set('Upload-Complete', '?0')
        .set('Upload-Length', '200')
        .send(content);

      uploadResource = response.headers['location'];
    });

    it('should require auth', async () => {
      const { status } = await request(baseUrl).delete(uploadResource);
      expect(status).toBe(401);

      const headResponse = await request(baseUrl)
        .head(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8');
      expect(headResponse.status).toBe(204);
    });

    it("should reject attempt to delete another user's asset", async () => {
      const { status } = await request(baseUrl)
        .delete(uploadResource)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(404);

      const headResponse = await request(baseUrl)
        .head(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8');
      expect(headResponse.status).toBe(204);
    });

    it('should reject attempt to delete completed asset', async () => {
      const content = randomBytes(1000);
      const postResponse = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', `sha=:${createHash('sha1').update(content).digest('base64')}:`)
        .set('Upload-Complete', '?0')
        .set('Content-Type', 'image/jpeg')
        .set('Upload-Length', '1000')
        .send(content);
      expect(postResponse.status).toBe(201);
      expect(postResponse.headers['upload-complete']).toBe('?0');
      const location = postResponse.headers['location'];
      expect(location).toBeDefined();

      const patchResponse = await request(baseUrl)
        .patch(location)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('Upload-Offset', '1000')
        .set('Upload-Complete', '?1')
        .set('Content-Type', 'application/partial-upload')
        .send();
      expect(patchResponse.status).toBe(200);
      expect(patchResponse.headers['upload-complete']).toBe('?1');

      const deleteResponse = await request(baseUrl).delete(location).set('Authorization', `Bearer ${user.accessToken}`);
      expect(deleteResponse.status).toBe(400);
      expect(deleteResponse.headers['content-type']).toBe('application/problem+json; charset=utf-8');
      expect(deleteResponse.body).toEqual({
        type: 'https://iana.org/assignments/http-problem-types#completed-upload',
        title: 'upload is already completed',
      });

      const headResponse = await request(baseUrl)
        .head(location)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8');
      expect(headResponse.status).toBe(204);
    });

    it('should cancel upload with DELETE request', async () => {
      const { status } = await request(baseUrl)
        .delete(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(204);

      const headResponse = await request(baseUrl)
        .head(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8');
      expect(headResponse.status).toBe(404);
    });

    it('should update quota usage', async () => {
      const content = randomBytes(200);
      const response = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${cancelQuotaUser.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', `sha=:${createHash('sha1').update(content).digest('base64')}:`)
        .set('Upload-Complete', '?0')
        .set('Upload-Length', '200')
        .send(content);
      const uploadResource = response.headers['location'];

      const userDataBefore = await getMyUser({ headers: asBearerAuth(cancelQuotaUser.accessToken) });
      expect(userDataBefore).toEqual(expect.objectContaining({ quotaUsageInBytes: 200 }));

      const { status } = await request(baseUrl)
        .delete(uploadResource)
        .set('Authorization', `Bearer ${cancelQuotaUser.accessToken}`);
      expect(status).toBe(204);

      const userDataAfter = await getMyUser({ headers: asBearerAuth(cancelQuotaUser.accessToken) });
      expect(userDataAfter).toEqual(expect.objectContaining({ quotaUsageInBytes: 0 }));

      const headResponse = await request(baseUrl)
        .head(uploadResource)
        .set('Authorization', `Bearer ${cancelQuotaUser.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8');
      expect(headResponse.status).toBe(404);
    });
  });

  describe('getUploadStatus', () => {
    let uploadResource: string;

    beforeAll(async () => {
      const content = randomBytes(512);
      // Create an incomplete upload first
      const { headers } = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8')
        .set('X-Immich-Asset-Data', assetData)
        .set('Repr-Digest', `sha=:${createHash('sha1').update(content).digest('base64')}:`)
        .set('Upload-Complete', '?0')
        .set('Upload-Length', '512')
        .send(content);

      expect(headers['location']).toBeDefined();
      uploadResource = headers['location'];
    });

    it('should require auth', async () => {
      const { status, headers } = await request(baseUrl).head(uploadResource).set('Upload-Draft-Interop-Version', '8');

      expect(status).toBe(401);
      expect(headers['upload-offset']).toBeUndefined();
      expect(headers['upload-complete']).toBeUndefined();
      expect(headers['upload-limit']).toBeUndefined();
    });

    it("should disallow fetching another user's asset", async () => {
      const { status, headers } = await request(baseUrl)
        .head(uploadResource)
        .set('Upload-Draft-Interop-Version', '8')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(404);
      expect(headers['upload-offset']).toBeUndefined();
      expect(headers['upload-complete']).toBeUndefined();
      expect(headers['upload-limit']).toBeUndefined();
    });

    it('should retrieve upload offset with HEAD request', async () => {
      const { status, headers } = await request(baseUrl)
        .head(uploadResource)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8');

      expect(status).toBe(204);
      expect(headers['upload-offset']).toBe('512');
      expect(headers['upload-complete']).toBe('?0');
      expect(headers['upload-limit']).toEqual('min-size=0');
      expect(headers['cache-control']).toBe('no-store');
    });

    it('should return 404 for non-existent upload resource', async () => {
      const { status } = await request(app)
        .head('/upload/4feacf6f-830f-46c8-8140-2b3da67070c0')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('Upload-Draft-Interop-Version', '8');

      expect(status).toBe(404);
    });
  });

  describe('getUploadOptions', () => {
    it('should include upload limits in response', async () => {
      const { status, headers } = await request(app).options('/upload');

      expect(status).toBe(204);
      expect(headers['upload-limit']).toEqual('min-size=0');
    });
  });
});
