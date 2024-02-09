import {
  AssetResponseDto,
  IAssetRepository,
  IPersonRepository,
  LibraryResponseDto,
  LoginResponseDto,
  TimeBucketSize,
  WithoutProperty,
  mapAsset,
  usePagination,
} from '@app/domain';
import { AssetController } from '@app/immich';
import { AssetEntity, AssetStackEntity, AssetType, SharedLinkType } from '@app/infra/entities';
import { AssetRepository } from '@app/infra/repositories';
import { INestApplication } from '@nestjs/common';
import { errorStub, userDto, uuidStub } from '@test/fixtures';
import { randomBytes } from 'node:crypto';
import request from 'supertest';
import { api } from '../../client';
import { generateAsset, testApp, today, yesterday } from '../utils';

const makeUploadDto = (options?: { omit: string }): Record<string, any> => {
  const dto: Record<string, any> = {
    deviceAssetId: 'example-image',
    deviceId: 'TEST',
    fileCreatedAt: new Date().toISOString(),
    fileModifiedAt: new Date().toISOString(),
    isFavorite: 'testing',
    duration: '0:00:00.000000',
  };

  const omit = options?.omit;
  if (omit) {
    delete dto[omit];
  }

  return dto;
};

describe(`${AssetController.name} (e2e)`, () => {
  let app: INestApplication;
  let server: any;
  let assetRepository: IAssetRepository;
  let user1: LoginResponseDto;
  let user2: LoginResponseDto;
  let userWithQuota: LoginResponseDto;
  let libraries: LibraryResponseDto[];
  let asset1: AssetResponseDto;
  let asset2: AssetResponseDto;
  let asset3: AssetResponseDto;
  let asset4: AssetResponseDto;
  let asset5: AssetResponseDto;

  const createAsset = async (
    loginResponse: LoginResponseDto,
    fileCreatedAt: Date,
    other: Partial<AssetEntity> = {},
  ) => {
    const asset = await assetRepository.create(
      generateAsset(loginResponse.userId, libraries, { fileCreatedAt, ...other }),
    );

    return mapAsset(asset);
  };

  beforeAll(async () => {
    app = await testApp.create();
    server = app.getHttpServer();
    assetRepository = app.get<IAssetRepository>(IAssetRepository);

    await testApp.reset();

    await api.authApi.adminSignUp(server);
    const admin = await api.authApi.adminLogin(server);

    await Promise.all([
      api.userApi.create(server, admin.accessToken, userDto.user1),
      api.userApi.create(server, admin.accessToken, userDto.user2),
      api.userApi.create(server, admin.accessToken, userDto.userWithQuota),
    ]);

    [user1, user2, userWithQuota] = await Promise.all([
      api.authApi.login(server, userDto.user1),
      api.authApi.login(server, userDto.user2),
      api.authApi.login(server, userDto.userWithQuota),
    ]);

    const [user1Libraries, user2Libraries] = await Promise.all([
      api.libraryApi.getAll(server, user1.accessToken),
      api.libraryApi.getAll(server, user2.accessToken),
    ]);

    libraries = [...user1Libraries, ...user2Libraries];
  });

  beforeEach(async () => {
    await testApp.reset({ entities: [AssetEntity, AssetStackEntity] });

    [asset1, asset2, asset3, asset4, asset5] = await Promise.all([
      createAsset(user1, new Date('1970-01-01')),
      createAsset(user1, new Date('1970-02-10')),
      createAsset(user1, new Date('1970-02-11'), {
        isFavorite: true,
        isArchived: true,
        isExternal: true,
        isReadOnly: true,
        type: AssetType.VIDEO,
        fileCreatedAt: yesterday.toJSDate(),
        fileModifiedAt: yesterday.toJSDate(),
        createdAt: yesterday.toJSDate(),
        updatedAt: yesterday.toJSDate(),
        localDateTime: yesterday.toJSDate(),
        encodedVideoPath: '/path/to/encoded-video.mp4',
        webpPath: '/path/to/thumb.webp',
        resizePath: '/path/to/thumb.jpg',
      }),
      createAsset(user2, new Date('1970-01-01')),
      createAsset(user1, new Date('1970-01-01'), {
        deletedAt: yesterday.toJSDate(),
      }),
    ]);

    await assetRepository.upsertExif({
      assetId: asset3.id,
      latitude: 90,
      longitude: 90,
      city: 'Immich',
      state: 'Nebraska',
      country: 'United States',
      make: 'Cannon',
      model: 'EOS Rebel T7',
      lensModel: 'Fancy lens',
    });
  });

  afterAll(async () => {
    await testApp.teardown();
  });

  describe('GET /assets', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get('/assets');
      expect(body).toEqual(errorStub.unauthorized);
      expect(status).toBe(401);
    });

    const badTests = [
      //
      {
        should: 'should reject page as a string',
        query: { page: 'abc' },
        expected: ['page must not be less than 1', 'page must be an integer number'],
      },
      {
        should: 'should reject page as a decimal',
        query: { page: 1.5 },
        expected: ['page must be an integer number'],
      },
      {
        should: 'should reject page as a negative number',
        query: { page: -10 },
        expected: ['page must not be less than 1'],
      },
      {
        should: 'should reject page as 0',
        query: { page: 0 },
        expected: ['page must not be less than 1'],
      },
      {
        should: 'should reject size as a string',
        query: { size: 'abc' },
        expected: ['size must not be less than 1', 'size must be an integer number'],
      },
      {
        should: 'should reject an invalid size',
        query: { size: -1.5 },
        expected: ['size must not be less than 1', 'size must be an integer number'],
      },
      ...[
        'isArchived',
        'isFavorite',
        'isReadOnly',
        'isExternal',
        'isEncoded',
        'isMotion',
        'isOffline',
        'isVisible',
      ].map((value) => ({
        should: `should reject ${value} not a boolean`,
        query: { [value]: 'immich' },
        expected: [`${value} must be a boolean value`],
      })),
    ];

    for (const { should, query, expected } of badTests) {
      it(should, async () => {
        const { status, body } = await request(server)
          .get('/assets')
          .set('Authorization', `Bearer ${user1.accessToken}`)
          .query(query);
        expect(status).toBe(400);
        expect(body).toEqual(errorStub.badRequest(expected));
      });
    }

    const searchTests = [
      {
        should: 'should only return my own assets',
        deferred: () => ({
          query: {},
          assets: [asset3, asset2, asset1],
        }),
      },
      {
        should: 'should sort my assets in reverse',
        deferred: () => ({
          query: { order: 'asc' },
          assets: [asset1, asset2, asset3],
        }),
      },
      {
        should: 'should support custom page sizes',
        deferred: () => ({
          query: { size: 1 },
          assets: [asset3],
        }),
      },
      {
        should: 'should support pagination',
        deferred: () => ({
          query: { size: 1, page: 2 },
          assets: [asset2],
        }),
      },
      {
        should: 'should search by checksum (base64)',
        deferred: () => ({
          query: { checksum: asset1.checksum },
          assets: [asset1],
        }),
      },
      {
        should: 'should search by checksum (hex)',
        deferred: () => ({
          query: { checksum: Buffer.from(asset1.checksum, 'base64').toString('hex') },
          assets: [asset1],
        }),
      },
      {
        should: 'should search by id',
        deferred: () => ({
          query: { id: asset1.id },
          assets: [asset1],
        }),
      },
      {
        should: 'should search by isFavorite (true)',
        deferred: () => ({
          query: { isFavorite: true },
          assets: [asset3],
        }),
      },
      {
        should: 'should search by isFavorite (false)',
        deferred: () => ({
          query: { isFavorite: false },
          assets: [asset2, asset1],
        }),
      },
      {
        should: 'should search by isArchived (true)',
        deferred: () => ({
          query: { isArchived: true },
          assets: [asset3],
        }),
      },
      {
        should: 'should search by isArchived (false)',
        deferred: () => ({
          query: { isArchived: false },
          assets: [asset2, asset1],
        }),
      },
      {
        should: 'should search by isReadOnly (true)',
        deferred: () => ({
          query: { isReadOnly: true },
          assets: [asset3],
        }),
      },
      {
        should: 'should search by isReadOnly (false)',
        deferred: () => ({
          query: { isReadOnly: false },
          assets: [asset2, asset1],
        }),
      },
      {
        should: 'should search by type (image)',
        deferred: () => ({
          query: { type: 'IMAGE' },
          assets: [asset2, asset1],
        }),
      },
      {
        should: 'should search by type (video)',
        deferred: () => ({
          query: { type: 'VIDEO' },
          assets: [asset3],
        }),
      },
      {
        should: 'should search by createdBefore',
        deferred: () => ({
          query: { createdBefore: yesterday.plus({ hour: 1 }).toJSDate() },
          assets: [asset3],
        }),
      },
      {
        should: 'should search by createdBefore (no results)',
        deferred: () => ({
          query: { createdBefore: yesterday.minus({ hour: 1 }).toJSDate() },
          assets: [],
        }),
      },
      {
        should: 'should search by createdAfter',
        deferred: () => ({
          query: { createdAfter: yesterday.minus({ hour: 1 }).toJSDate() },
          assets: [asset3, asset2, asset1],
        }),
      },
      {
        should: 'should search by createdAfter (no results)',
        deferred: () => ({
          query: { createdAfter: today.plus({ hour: 1 }).toJSDate() },
          assets: [],
        }),
      },
      {
        should: 'should search by updatedBefore',
        deferred: () => ({
          query: { updatedBefore: yesterday.plus({ hour: 1 }).toJSDate() },
          assets: [asset3],
        }),
      },
      {
        should: 'should search by updatedBefore (no results)',
        deferred: () => ({
          query: { updatedBefore: yesterday.minus({ hour: 1 }).toJSDate() },
          assets: [],
        }),
      },
      {
        should: 'should search by updatedAfter',
        deferred: () => ({
          query: { updatedAfter: yesterday.minus({ hour: 1 }).toJSDate() },
          assets: [asset3, asset2, asset1],
        }),
      },
      {
        should: 'should search by updatedAfter (no results)',
        deferred: () => ({
          query: { updatedAfter: today.plus({ hour: 1 }).toJSDate() },
          assets: [],
        }),
      },
      {
        should: 'should search by trashedBefore',
        deferred: () => ({
          query: { trashedBefore: yesterday.plus({ hour: 1 }).toJSDate() },
          assets: [asset5],
        }),
      },
      {
        should: 'should search by trashedBefore (no results)',
        deferred: () => ({
          query: { trashedBefore: yesterday.minus({ hour: 1 }).toJSDate() },
          assets: [],
        }),
      },
      {
        should: 'should search by trashedAfter',
        deferred: () => ({
          query: { trashedAfter: yesterday.minus({ hour: 1 }).toJSDate() },
          assets: [asset5],
        }),
      },
      {
        should: 'should search by trashedAfter (no results)',
        deferred: () => ({
          query: { trashedAfter: today.plus({ hour: 1 }).toJSDate() },
          assets: [],
        }),
      },
      {
        should: 'should search by takenBefore',
        deferred: () => ({
          query: { takenBefore: yesterday.plus({ hour: 1 }).toJSDate() },
          assets: [asset3, asset2, asset1],
        }),
      },
      {
        should: 'should search by takenBefore (no results)',
        deferred: () => ({
          query: { takenBefore: yesterday.minus({ years: 100 }).toJSDate() },
          assets: [],
        }),
      },
      {
        should: 'should search by takenAfter',
        deferred: () => ({
          query: { takenAfter: yesterday.minus({ hour: 1 }).toJSDate() },
          assets: [asset3],
        }),
      },
      {
        should: 'should search by takenAfter (no results)',
        deferred: () => ({
          query: { takenAfter: today.plus({ hour: 1 }).toJSDate() },
          assets: [],
        }),
      },
      {
        should: 'should search by originalPath',
        deferred: () => ({
          query: { originalPath: asset1.originalPath },
          assets: [asset1],
        }),
      },
      {
        should: 'should search by originalFilename',
        deferred: () => ({
          query: { originalFileName: asset1.originalFileName },
          assets: [asset1],
        }),
      },
      {
        should: 'should search by encodedVideoPath',
        deferred: () => ({
          query: { encodedVideoPath: '/path/to/encoded-video.mp4' },
          assets: [asset3],
        }),
      },
      {
        should: 'should search by resizePath',
        deferred: () => ({
          query: { resizePath: '/path/to/thumb.jpg' },
          assets: [asset3],
        }),
      },
      {
        should: 'should search by webpPath',
        deferred: () => ({
          query: { webpPath: '/path/to/thumb.webp' },
          assets: [asset3],
        }),
      },
      {
        should: 'should search by city',
        deferred: () => ({
          query: { city: 'Immich' },
          assets: [asset3],
        }),
      },
      {
        should: 'should search by state',
        deferred: () => ({
          query: { state: 'Nebraska' },
          assets: [asset3],
        }),
      },
      {
        should: 'should search by country',
        deferred: () => ({
          query: { country: 'United States' },
          assets: [asset3],
        }),
      },
      {
        should: 'sohuld search by make',
        deferred: () => ({
          query: { make: 'Cannon' },
          assets: [asset3],
        }),
      },
      {
        should: 'should search by country',
        deferred: () => ({
          query: { model: 'EOS Rebel T7' },
          assets: [asset3],
        }),
      },
      {
        should: 'should search by lensModel',
        deferred: () => ({
          query: { lensModel: 'Fancy lens' },
          assets: [asset3],
        }),
      },
    ];

    for (const { should, deferred } of searchTests) {
      it(should, async () => {
        const { assets, query } = deferred();
        const { status, body } = await request(server)
          .get('/assets')
          .query(query)
          .set('Authorization', `Bearer ${user1.accessToken}`);

        expect(status).toBe(200);
        expect(body.length).toBe(assets.length);
        for (let i = 0; i < assets.length; i++) {
          expect(body[i]).toEqual(expect.objectContaining({ id: assets[i].id }));
        }
      });
    }
  });

  describe('GET /asset/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get(`/asset/${uuidStub.notFound}`);
      expect(body).toEqual(errorStub.unauthorized);
      expect(status).toBe(401);
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(server)
        .get(`/asset/${uuidStub.invalid}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest(['id must be a UUID']));
    });

    it('should require access', async () => {
      const { status, body } = await request(server)
        .get(`/asset/${asset4.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorStub.noPermission);
    });

    it('should get the asset info', async () => {
      const { status, body } = await request(server)
        .get(`/asset/${asset1.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(200);
      expect(body).toMatchObject({ id: asset1.id });
    });

    it('should work with a shared link', async () => {
      const sharedLink = await api.sharedLinkApi.create(server, user1.accessToken, {
        type: SharedLinkType.INDIVIDUAL,
        assetIds: [asset1.id],
      });

      const { status, body } = await request(server).get(`/asset/${asset1.id}?key=${sharedLink.key}`);
      expect(status).toBe(200);
      expect(body).toMatchObject({ id: asset1.id });
    });

    it('should not send people data for shared links for un-authenticated users', async () => {
      const personRepository = app.get<IPersonRepository>(IPersonRepository);
      const person = await personRepository.create({ ownerId: asset1.ownerId, name: 'Test Person' });

      await personRepository.createFaces([
        {
          assetId: asset1.id,
          personId: person.id,
          embedding: Array.from({ length: 512 }, Math.random),
        },
      ]);

      const { status, body } = await request(server)
        .put(`/asset/${asset1.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ isFavorite: true });
      expect(status).toEqual(200);
      expect(body).toMatchObject({
        id: asset1.id,
        isFavorite: true,
        people: [
          {
            birthDate: null,
            id: expect.any(String),
            isHidden: false,
            name: 'Test Person',
            thumbnailPath: '',
          },
        ],
      });

      const sharedLink = await api.sharedLinkApi.create(server, user1.accessToken, {
        type: SharedLinkType.INDIVIDUAL,
        assetIds: [asset1.id],
      });

      const data = await request(server).get(`/asset/${asset1.id}?key=${sharedLink.key}`);
      expect(data.status).toBe(200);
      expect(data.body).toMatchObject({ people: [] });
    });
  });

  describe('POST /asset/upload', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server)
        .post(`/asset/upload`)
        .field('deviceAssetId', 'example-image')
        .field('deviceId', 'TEST')
        .field('fileCreatedAt', new Date().toISOString())
        .field('fileModifiedAt', new Date().toISOString())
        .field('isFavorite', false)
        .field('duration', '0:00:00.000000')
        .attach('assetData', randomBytes(32), 'example.jpg');

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    const invalid = [
      { should: 'require `deviceAssetId`', dto: { ...makeUploadDto({ omit: 'deviceAssetId' }) } },
      { should: 'require `deviceId`', dto: { ...makeUploadDto({ omit: 'deviceId' }) } },
      { should: 'require `fileCreatedAt`', dto: { ...makeUploadDto({ omit: 'fileCreatedAt' }) } },
      { should: 'require `fileModifiedAt`', dto: { ...makeUploadDto({ omit: 'fileModifiedAt' }) } },
      { should: 'require `duration`', dto: { ...makeUploadDto({ omit: 'duration' }) } },
      { should: 'throw if `isFavorite` is not a boolean', dto: { ...makeUploadDto(), isFavorite: 'not-a-boolean' } },
      { should: 'throw if `isVisible` is not a boolean', dto: { ...makeUploadDto(), isVisible: 'not-a-boolean' } },
      { should: 'throw if `isArchived` is not a boolean', dto: { ...makeUploadDto(), isArchived: 'not-a-boolean' } },
    ];

    for (const { should, dto } of invalid) {
      it(`should ${should}`, async () => {
        const { status, body } = await request(server)
          .post('/asset/upload')
          .set('Authorization', `Bearer ${user1.accessToken}`)
          .attach('assetData', randomBytes(32), 'example.jpg')
          .field(dto);
        expect(status).toBe(400);
        expect(body).toEqual(errorStub.badRequest());
      });
    }

    it('should upload a new asset', async () => {
      const { body, status } = await request(server)
        .post('/asset/upload')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .field('deviceAssetId', 'example-image')
        .field('deviceId', 'TEST')
        .field('fileCreatedAt', new Date().toISOString())
        .field('fileModifiedAt', new Date().toISOString())
        .field('isFavorite', 'true')
        .field('duration', '0:00:00.000000')
        .attach('assetData', randomBytes(32), 'example.jpg');
      expect(status).toBe(201);
      expect(body).toEqual({ id: expect.any(String), duplicate: false });

      const asset = await api.assetApi.get(server, user1.accessToken, body.id);
      expect(asset).toMatchObject({ id: body.id, isFavorite: true });
    });

    it('should not upload the same asset twice', async () => {
      const content = randomBytes(32);
      await api.assetApi.upload(server, user1.accessToken, 'example-image', { content });
      const { body, status } = await request(server)
        .post('/asset/upload')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .field('deviceAssetId', 'example-image')
        .field('deviceId', 'TEST')
        .field('fileCreatedAt', new Date().toISOString())
        .field('fileModifiedAt', new Date().toISOString())
        .field('isFavorite', false)
        .field('duration', '0:00:00.000000')
        .attach('assetData', content, 'example.jpg');

      expect(status).toBe(200);
      expect(body.duplicate).toBe(true);
    });

    it("should not upload to another user's library", async () => {
      const content = randomBytes(32);
      const library = (await api.libraryApi.getAll(server, user2.accessToken))[0];
      await api.assetApi.upload(server, user1.accessToken, 'example-image', { content });

      const { body, status } = await request(server)
        .post('/asset/upload')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .field('libraryId', library.id)
        .field('deviceAssetId', 'example-image')
        .field('deviceId', 'TEST')
        .field('fileCreatedAt', new Date().toISOString())
        .field('fileModifiedAt', new Date().toISOString())
        .field('isFavorite', false)
        .field('duration', '0:00:00.000000')
        .attach('assetData', content, 'example.jpg');

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest('Not found or no asset.upload access'));
    });

    it('should update the used quota', async () => {
      const content = randomBytes(32);
      const { body, status } = await request(server)
        .post('/asset/upload')
        .set('Authorization', `Bearer ${userWithQuota.accessToken}`)
        .field('deviceAssetId', 'example-image')
        .field('deviceId', 'TEST')
        .field('fileCreatedAt', new Date().toISOString())
        .field('fileModifiedAt', new Date().toISOString())
        .field('isFavorite', 'true')
        .field('duration', '0:00:00.000000')
        .attach('assetData', content, 'example.jpg');

      expect(status).toBe(201);
      expect(body).toEqual({ id: expect.any(String), duplicate: false });

      const { body: user } = await request(server)
        .get('/user/me')
        .set('Authorization', `Bearer ${userWithQuota.accessToken}`);

      expect(user).toEqual(expect.objectContaining({ quotaUsageInBytes: 32 }));
    });

    it('should not upload an asset if it would exceed the quota', async () => {
      const content = randomBytes(420);
      const { body, status } = await request(server)
        .post('/asset/upload')
        .set('Authorization', `Bearer ${userWithQuota.accessToken}`)
        .field('deviceAssetId', 'example-image')
        .field('deviceId', 'TEST')
        .field('fileCreatedAt', new Date().toISOString())
        .field('fileModifiedAt', new Date().toISOString())
        .field('isFavorite', 'true')
        .field('duration', '0:00:00.000000')
        .attach('assetData', content, 'example.jpg');

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest('Quota has been exceeded!'));
    });
  });

  describe('PUT /asset/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).put(`/asset/:${uuidStub.notFound}`);
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(server)
        .put(`/asset/${uuidStub.invalid}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest(['id must be a UUID']));
    });

    it('should require access', async () => {
      const { status, body } = await request(server)
        .put(`/asset/${asset4.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorStub.noPermission);
    });

    it('should favorite an asset', async () => {
      expect(asset1).toMatchObject({ isFavorite: false });

      const { status, body } = await request(server)
        .put(`/asset/${asset1.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ isFavorite: true });
      expect(body).toMatchObject({ id: asset1.id, isFavorite: true });
      expect(status).toEqual(200);
    });

    it('should archive an asset', async () => {
      expect(asset1).toMatchObject({ isArchived: false });

      const { status, body } = await request(server)
        .put(`/asset/${asset1.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ isArchived: true });
      expect(body).toMatchObject({ id: asset1.id, isArchived: true });
      expect(status).toEqual(200);
    });

    it('should update date time original', async () => {
      const { status, body } = await request(server)
        .put(`/asset/${asset1.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ dateTimeOriginal: '2023-11-19T18:11:00.000-07:00' });

      expect(body).toMatchObject({
        id: asset1.id,
        exifInfo: expect.objectContaining({ dateTimeOriginal: '2023-11-20T01:11:00.000Z' }),
      });
      expect(status).toEqual(200);
    });

    it('should reject invalid gps coordinates', async () => {
      for (const test of [
        { latitude: 12 },
        { longitude: 12 },
        { latitude: 12, longitude: 'abc' },
        { latitude: 'abc', longitude: 12 },
        { latitude: null, longitude: 12 },
        { latitude: 12, longitude: null },
        { latitude: 91, longitude: 12 },
        { latitude: -91, longitude: 12 },
        { latitude: 12, longitude: -181 },
        { latitude: 12, longitude: 181 },
      ]) {
        const { status, body } = await request(server)
          .put(`/asset/${asset1.id}`)
          .send(test)
          .set('Authorization', `Bearer ${user1.accessToken}`);
        expect(status).toBe(400);
        expect(body).toEqual(errorStub.badRequest());
      }
    });

    it('should update gps data', async () => {
      const { status, body } = await request(server)
        .put(`/asset/${asset1.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ latitude: 12, longitude: 12 });

      expect(body).toMatchObject({
        id: asset1.id,
        exifInfo: expect.objectContaining({ latitude: 12, longitude: 12 }),
      });
      expect(status).toEqual(200);
    });

    it('should set the description', async () => {
      const { status, body } = await request(server)
        .put(`/asset/${asset1.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ description: 'Test asset description' });
      expect(body).toMatchObject({
        id: asset1.id,
        exifInfo: expect.objectContaining({ description: 'Test asset description' }),
      });
      expect(status).toEqual(200);
    });

    it('should return tagged people', async () => {
      const personRepository = app.get<IPersonRepository>(IPersonRepository);
      const person = await personRepository.create({ ownerId: asset1.ownerId, name: 'Test Person' });

      await personRepository.createFaces([
        {
          assetId: asset1.id,
          personId: person.id,
          embedding: Array.from({ length: 512 }, Math.random),
        },
      ]);

      const { status, body } = await request(server)
        .put(`/asset/${asset1.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ isFavorite: true });
      expect(status).toEqual(200);
      expect(body).toMatchObject({
        id: asset1.id,
        isFavorite: true,
        people: [
          {
            birthDate: null,
            id: expect.any(String),
            isHidden: false,
            name: 'Test Person',
            thumbnailPath: '',
          },
        ],
      });
    });
  });

  describe('GET /asset/statistics', () => {
    beforeEach(async () => {
      await api.assetApi.upload(server, user1.accessToken, 'favored_asset', { isFavorite: true });
      await api.assetApi.upload(server, user1.accessToken, 'archived_asset', { isArchived: true });
      await api.assetApi.upload(server, user1.accessToken, 'favored_archived_asset', {
        isFavorite: true,
        isArchived: true,
      });
    });

    it('should require authentication', async () => {
      const { status, body } = await request(server).get('/asset/statistics');

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should return stats of all assets', async () => {
      const { status, body } = await request(server)
        .get('/asset/statistics')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(body).toEqual({ images: 5, videos: 1, total: 6 });
      expect(status).toBe(200);
    });

    it('should return stats of all favored assets', async () => {
      const { status, body } = await request(server)
        .get('/asset/statistics')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ isFavorite: true });

      expect(status).toBe(200);
      expect(body).toEqual({ images: 2, videos: 1, total: 3 });
    });

    it('should return stats of all archived assets', async () => {
      const { status, body } = await request(server)
        .get('/asset/statistics')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ isArchived: true });

      expect(status).toBe(200);
      expect(body).toEqual({ images: 2, videos: 1, total: 3 });
    });

    it('should return stats of all favored and archived assets', async () => {
      const { status, body } = await request(server)
        .get('/asset/statistics')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ isFavorite: true, isArchived: true });

      expect(status).toBe(200);
      expect(body).toEqual({ images: 1, videos: 1, total: 2 });
    });

    it('should return stats of all assets neither favored nor archived', async () => {
      const { status, body } = await request(server)
        .get('/asset/statistics')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ isFavorite: false, isArchived: false });

      expect(status).toBe(200);
      expect(body).toEqual({ images: 2, videos: 0, total: 2 });
    });
  });

  describe('GET /asset/random', () => {
    beforeAll(async () => {
      await Promise.all([
        createAsset(user1, new Date('1970-02-01')),
        createAsset(user1, new Date('1970-02-01')),
        createAsset(user1, new Date('1970-02-01')),
        createAsset(user1, new Date('1970-02-01')),
        createAsset(user1, new Date('1970-02-01')),
        createAsset(user1, new Date('1970-02-01')),
      ]);
    });
    it('should require authentication', async () => {
      const { status, body } = await request(server).get('/asset/random');

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it.each(Array(10))('should return 1 random assets', async () => {
      const { status, body } = await request(server)
        .get('/asset/random')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);

      const assets: AssetResponseDto[] = body;
      expect(assets.length).toBe(1);
      expect(assets[0].ownerId).toBe(user1.userId);
      //
      // assets owned by user2
      expect(assets[0].id).not.toBe(asset4.id);
      // assets owned by user1
      expect([asset1.id, asset2.id, asset3.id]).toContain(assets[0].id);
    });

    it.each(Array(10))('should return 2 random assets', async () => {
      const { status, body } = await request(server)
        .get('/asset/random?count=2')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);

      const assets: AssetResponseDto[] = body;
      expect(assets.length).toBe(2);

      for (const asset of assets) {
        expect(asset.ownerId).toBe(user1.userId);
        // assets owned by user1
        expect([asset1.id, asset2.id, asset3.id]).toContain(asset.id);
        // assets owned by user2
        expect(asset.id).not.toBe(asset4.id);
      }
    });

    it.each(Array(10))(
      'should return 1 asset if there are 10 assets in the database but user 2 only has 1',
      async () => {
        const { status, body } = await request(server)
          .get('/[]asset/random')
          .set('Authorization', `Bearer ${user2.accessToken}`);

        expect(status).toBe(200);
        expect(body).toEqual([expect.objectContaining({ id: asset4.id })]);
      },
    );

    it('should return error', async () => {
      const { status } = await request(server)
        .get('/asset/random?count=ABC')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(400);
    });
  });

  describe('GET /asset/time-buckets', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get('/asset/time-buckets').query({ size: TimeBucketSize.MONTH });

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should get time buckets by month', async () => {
      const { status, body } = await request(server)
        .get('/asset/time-buckets')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ size: TimeBucketSize.MONTH });

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.arrayContaining([
          { count: 1, timeBucket: '2023-11-01T00:00:00.000Z' },
          { count: 1, timeBucket: '1970-01-01T00:00:00.000Z' },
          { count: 1, timeBucket: '1970-02-01T00:00:00.000Z' },
        ]),
      );
    });

    it('should not allow access for unrelated shared links', async () => {
      const sharedLink = await api.sharedLinkApi.create(server, user1.accessToken, {
        type: SharedLinkType.INDIVIDUAL,
        assetIds: [asset1.id, asset2.id],
      });

      const { status, body } = await request(server)
        .get('/asset/time-buckets')
        .query({ key: sharedLink.key, size: TimeBucketSize.MONTH });

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.noPermission);
    });

    it('should get time buckets by day', async () => {
      const { status, body } = await request(server)
        .get('/asset/time-buckets')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ size: TimeBucketSize.DAY });

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.arrayContaining([
          { count: 1, timeBucket: asset1.fileCreatedAt.toISOString() },
          { count: 1, timeBucket: asset2.fileCreatedAt.toISOString() },
          { count: 1, timeBucket: asset3.fileCreatedAt.toISOString() },
        ]),
      );
    });
  });

  describe('GET /asset/time-bucket', () => {
    let timeBucket: string;
    beforeEach(async () => {
      const { body, status } = await request(server)
        .get('/asset/time-buckets')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ size: TimeBucketSize.MONTH });

      expect(status).toBe(200);
      timeBucket = body[1].timeBucket;
    });

    it('should require authentication', async () => {
      const { status, body } = await request(server)
        .get('/asset/time-bucket')
        .query({ size: TimeBucketSize.MONTH, timeBucket });

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should handle 5 digit years', async () => {
      const { status, body } = await request(server)
        .get('/asset/time-bucket')
        .query({ size: TimeBucketSize.MONTH, timeBucket: '+012345-01-01T00:00:00.000Z' })
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual([]);
    });

    // it('should fail if time bucket is invalid', async () => {
    //   const { status, body } = await request(server)
    //     .get('/asset/time-bucket')
    //     .set('Authorization', `Bearer ${user1.accessToken}`)
    //     .query({ size: TimeBucketSize.MONTH, timeBucket: 'foo' });

    //   expect(status).toBe(400);
    //   expect(body).toEqual(errorStub.badRequest);
    // });

    it('should return time bucket', async () => {
      const { status, body } = await request(server)
        .get('/asset/time-bucket')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ size: TimeBucketSize.MONTH, timeBucket });

      expect(status).toBe(200);
      expect(body).toEqual(expect.arrayContaining([expect.objectContaining({ id: asset2.id })]));
    });

    it('should return error if time bucket is requested with partners asset and archived', async () => {
      const req1 = await request(server)
        .get('/asset/time-buckets')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ size: TimeBucketSize.MONTH, withPartners: true, isArchived: true });

      expect(req1.status).toBe(400);
      expect(req1.body).toEqual(errorStub.badRequest());

      const req2 = await request(server)
        .get('/asset/time-buckets')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ size: TimeBucketSize.MONTH, withPartners: true, isArchived: undefined });

      expect(req2.status).toBe(400);
      expect(req2.body).toEqual(errorStub.badRequest());
    });

    it('should return error if time bucket is requested with partners asset and favorite', async () => {
      const req1 = await request(server)
        .get('/asset/time-buckets')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ size: TimeBucketSize.MONTH, withPartners: true, isFavorite: true });

      expect(req1.status).toBe(400);
      expect(req1.body).toEqual(errorStub.badRequest());

      const req2 = await request(server)
        .get('/asset/time-buckets')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ size: TimeBucketSize.MONTH, withPartners: true, isFavorite: false });

      expect(req2.status).toBe(400);
      expect(req2.body).toEqual(errorStub.badRequest());
    });

    it('should return error if time bucket is requested with partners asset and trash', async () => {
      const req = await request(server)
        .get('/asset/time-buckets')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ size: TimeBucketSize.MONTH, withPartners: true, isTrashed: true });

      expect(req.status).toBe(400);
      expect(req.body).toEqual(errorStub.badRequest());
    });
  });

  describe('GET /asset/map-marker', () => {
    beforeEach(async () => {
      await Promise.all([
        assetRepository.save({ id: asset1.id, isArchived: true }),
        assetRepository.upsertExif({ assetId: asset1.id, latitude: 0, longitude: 0 }),
        assetRepository.upsertExif({ assetId: asset2.id, latitude: 0, longitude: 0 }),
      ]);
    });

    it('should require authentication', async () => {
      const { status, body } = await request(server).get('/asset/map-marker');

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should get map markers for all non-archived assets', async () => {
      const { status, body } = await request(server)
        .get('/asset/map-marker')
        .query({ isArchived: false })
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body).toEqual(expect.arrayContaining([expect.objectContaining({ id: asset2.id })]));
    });

    it('should get all map markers', async () => {
      const { status, body } = await request(server)
        .get('/asset/map-marker')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ isArchived: false });

      expect(status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body).toEqual([expect.objectContaining({ id: asset2.id })]);
    });
  });

  describe('PUT /asset', () => {
    beforeEach(async () => {
      const { status } = await request(server)
        .put('/asset')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ stackParentId: asset1.id, ids: [asset2.id, asset3.id] });

      expect(status).toBe(204);
    });

    it('should require authentication', async () => {
      const { status, body } = await request(server).put('/asset');

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should require a valid parent id', async () => {
      const { status, body } = await request(server)
        .put('/asset')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ stackParentId: uuidStub.invalid, ids: [asset1.id] });

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest(['stackParentId must be a UUID']));
    });

    it('should require access to the parent', async () => {
      const { status, body } = await request(server)
        .put('/asset')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ stackParentId: asset4.id, ids: [asset1.id] });

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.noPermission);
    });

    it('should add stack children', async () => {
      const [parent, child] = await Promise.all([
        createAsset(user1, new Date('1970-01-01')),
        createAsset(user1, new Date('1970-01-01')),
      ]);

      const { status } = await request(server)
        .put('/asset')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ stackParentId: parent.id, ids: [child.id] });

      expect(status).toBe(204);

      const asset = await api.assetApi.get(server, user1.accessToken, parent.id);
      expect(asset.stack).not.toBeUndefined();
      expect(asset.stack).toEqual(expect.arrayContaining([expect.objectContaining({ id: child.id })]));
    });

    it('should remove stack children', async () => {
      const { status } = await request(server)
        .put('/asset')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ removeParent: true, ids: [asset2.id] });

      expect(status).toBe(204);

      const asset = await api.assetApi.get(server, user1.accessToken, asset1.id);
      expect(asset.stack).not.toBeUndefined();
      expect(asset.stack).toEqual(expect.arrayContaining([expect.objectContaining({ id: asset3.id })]));
    });

    it('should remove all stack children', async () => {
      const { status } = await request(server)
        .put('/asset')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ removeParent: true, ids: [asset2.id, asset3.id] });

      expect(status).toBe(204);

      const asset = await api.assetApi.get(server, user1.accessToken, asset1.id);
      expect(asset.stack).toBeUndefined();
    });

    it('should merge stack children', async () => {
      const newParent = await createAsset(user1, new Date('1970-01-01'));
      const { status } = await request(server)
        .put('/asset')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ stackParentId: newParent.id, ids: [asset1.id] });

      expect(status).toBe(204);

      const asset = await api.assetApi.get(server, user1.accessToken, newParent.id);
      expect(asset.stack).not.toBeUndefined();
      expect(asset.stack).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: asset1.id }),
          expect.objectContaining({ id: asset2.id }),
          expect.objectContaining({ id: asset3.id }),
        ]),
      );
    });
  });

  describe('PUT /asset/stack/parent', () => {
    beforeEach(async () => {
      const { status } = await request(server)
        .put('/asset')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ stackParentId: asset1.id, ids: [asset2.id, asset3.id] });

      expect(status).toBe(204);
    });

    it('should require authentication', async () => {
      const { status, body } = await request(server).put('/asset/stack/parent');

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(server)
        .put('/asset/stack/parent')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ oldParentId: uuidStub.invalid, newParentId: uuidStub.invalid });

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest());
    });

    it('should require access', async () => {
      const { status, body } = await request(server)
        .put('/asset/stack/parent')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ oldParentId: asset4.id, newParentId: asset1.id });

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.noPermission);
    });

    it('should make old parent child of new parent', async () => {
      const { status } = await request(server)
        .put('/asset/stack/parent')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ oldParentId: asset1.id, newParentId: asset2.id });

      expect(status).toBe(200);

      const asset = await api.assetApi.get(server, user1.accessToken, asset2.id);
      expect(asset.stack).not.toBeUndefined();
      expect(asset.stack).toEqual(expect.arrayContaining([expect.objectContaining({ id: asset1.id })]));
    });

    it('should make all childrens of old parent, a child of new parent', async () => {
      const { status } = await request(server)
        .put('/asset/stack/parent')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ oldParentId: asset1.id, newParentId: asset2.id });

      expect(status).toBe(200);

      const asset = await api.assetApi.get(server, user1.accessToken, asset2.id);
      expect(asset.stack).not.toBeUndefined();
      expect(asset.stack).toEqual(expect.arrayContaining([expect.objectContaining({ id: asset3.id })]));
    });
  });

  const getAssetIdsWithoutFaces = async () => {
    const assetPagination = usePagination(10, (pagination) =>
      assetRepository.getWithout(pagination, WithoutProperty.FACES),
    );
    let assets: AssetEntity[] = [];
    for await (const assetsPage of assetPagination) {
      assets = [...assets, ...assetsPage];
    }
    return assets.map((a) => a.id);
  };

  describe(AssetRepository.name, () => {
    describe('getWithout', () => {
      describe('WithoutProperty.FACES', () => {
        beforeEach(async () => {
          await assetRepository.save({ id: asset1.id, resizePath: '/path/to/resize' });
          expect(await getAssetIdsWithoutFaces()).toContain(asset1.id);
        });

        describe('with recognized faces', () => {
          beforeEach(async () => {
            const personRepository = app.get<IPersonRepository>(IPersonRepository);
            const person = await personRepository.create({ ownerId: asset1.ownerId, name: 'Test Person' });
            await personRepository.createFaces([
              {
                assetId: asset1.id,
                personId: person.id,
                embedding: Array.from({ length: 512 }, Math.random),
              },
            ]);
          });

          it('should not return asset with facesRecognizedAt unset', async () => {
            expect(await getAssetIdsWithoutFaces()).not.toContain(asset1.id);
          });

          it('should not return asset with facesRecognizedAt set', async () => {
            await assetRepository.upsertJobStatus({ assetId: asset1.id, facesRecognizedAt: new Date() });
            expect(await getAssetIdsWithoutFaces()).not.toContain(asset1.id);
          });
        });

        describe('without recognized faces', () => {
          it('should return asset with facesRecognizedAt unset', async () => {
            expect(await getAssetIdsWithoutFaces()).toContain(asset1.id);
          });

          it('should not return asset with facesRecognizedAt set', async () => {
            expect(await getAssetIdsWithoutFaces()).toContain(asset1.id);
            await assetRepository.upsertJobStatus({ assetId: asset1.id, facesRecognizedAt: new Date() });
            expect(await getAssetIdsWithoutFaces()).not.toContain(asset1.id);
          });
        });
      });
    });
  });
});
