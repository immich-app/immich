import { IAssetRepository, IFaceRepository, IPersonRepository, LoginResponseDto, TimeBucketSize } from '@app/domain';
import { AppModule, AssetController } from '@app/immich';
import { AssetEntity, AssetType } from '@app/infra/entities';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { api } from '@test/api';
import { db } from '@test/db';
import { errorStub, uuidStub } from '@test/fixtures';
import { randomBytes } from 'crypto';
import request from 'supertest';

const user1Dto = {
  email: 'user1@immich.app',
  password: 'Password123',
  firstName: 'User 1',
  lastName: 'Test',
};

const user2Dto = {
  email: 'user2@immich.app',
  password: 'Password123',
  firstName: 'User 2',
  lastName: 'Test',
};

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

let assetCount = 0;
const createAsset = (
  repository: IAssetRepository,
  loginResponse: LoginResponseDto,
  libraryId: string,
  createdAt: Date,
): Promise<AssetEntity> => {
  const id = assetCount++;
  return repository.save({
    ownerId: loginResponse.userId,
    checksum: randomBytes(20),
    originalPath: `/tests/test_${id}`,
    deviceAssetId: `test_${id}`,
    deviceId: 'e2e-test',
    libraryId,
    fileCreatedAt: createdAt,
    fileModifiedAt: new Date(),
    type: AssetType.IMAGE,
    originalFileName: `test_${id}`,
  });
};

describe(`${AssetController.name} (e2e)`, () => {
  let app: INestApplication;
  let server: any;
  let assetRepository: IAssetRepository;
  let user1: LoginResponseDto;
  let user2: LoginResponseDto;
  let asset1: AssetEntity;
  let asset2: AssetEntity;
  let asset3: AssetEntity;
  let asset4: AssetEntity;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await moduleFixture.createNestApplication().init();
    server = app.getHttpServer();
    assetRepository = app.get<IAssetRepository>(IAssetRepository);
  });

  beforeEach(async () => {
    await db.reset();
    await api.authApi.adminSignUp(server);
    const admin = await api.authApi.adminLogin(server);

    const libraries = await api.libraryApi.getAll(server, admin.accessToken);
    const defaultLibrary = libraries[0];

    await api.userApi.create(server, admin.accessToken, user1Dto);
    user1 = await api.authApi.login(server, { email: user1Dto.email, password: user1Dto.password });

    asset1 = await createAsset(assetRepository, user1, defaultLibrary.id, new Date('1970-01-01'));
    asset2 = await createAsset(assetRepository, user1, defaultLibrary.id, new Date('1970-01-02'));
    asset3 = await createAsset(assetRepository, user1, defaultLibrary.id, new Date('1970-02-01'));

    await api.userApi.create(server, admin.accessToken, user2Dto);
    user2 = await api.authApi.login(server, { email: user2Dto.email, password: user2Dto.password });
    asset4 = await createAsset(assetRepository, user2, defaultLibrary.id, new Date('1970-01-01'));
  });

  afterAll(async () => {
    await db.disconnect();
    await app.close();
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
      { should: 'require `isFavorite`', dto: { ...makeUploadDto({ omit: 'isFavorite' }) } },
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

      const faceRepository = app.get<IFaceRepository>(IFaceRepository);
      await faceRepository.create({ assetId: asset1.id, personId: person.id });

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

  describe('POST /asset/download/info', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server)
        .post(`/asset/download/info`)
        .send({ assetIds: [asset1.id] });

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should download info', async () => {
      const { status, body } = await request(server)
        .post('/asset/download/info')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [asset1.id] });

      expect(status).toBe(201);
      expect(body).toEqual(expect.objectContaining({ archives: [expect.objectContaining({ assetIds: [asset1.id] })] }));
    });
  });

  describe('POST /asset/download/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).post(`/asset/download/${asset1.id}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should download file', async () => {
      const asset = await api.assetApi.upload(server, user1.accessToken, 'example');
      const response = await request(server)
        .post(`/asset/download/${asset.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toEqual('image/jpeg');
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
      const { status, body } = await request(server).get('/album/statistics');

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should return stats of all assets', async () => {
      const { status, body } = await request(server)
        .get('/asset/statistics')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual({ images: 6, videos: 0, total: 6 });
    });

    it('should return stats of all favored assets', async () => {
      const { status, body } = await request(server)
        .get('/asset/statistics')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ isFavorite: true });

      expect(status).toBe(200);
      expect(body).toEqual({ images: 2, videos: 0, total: 2 });
    });

    it('should return stats of all archived assets', async () => {
      const { status, body } = await request(server)
        .get('/asset/statistics')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ isArchived: true });

      expect(status).toBe(200);
      expect(body).toEqual({ images: 2, videos: 0, total: 2 });
    });

    it('should return stats of all favored and archived assets', async () => {
      const { status, body } = await request(server)
        .get('/asset/statistics')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ isFavorite: true, isArchived: true });

      expect(status).toBe(200);
      expect(body).toEqual({ images: 1, videos: 0, total: 1 });
    });

    it('should return stats of all assets neither favored nor archived', async () => {
      const { status, body } = await request(server)
        .get('/asset/statistics')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ isFavorite: false, isArchived: false });

      expect(status).toBe(200);
      expect(body).toEqual({ images: 3, videos: 0, total: 3 });
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
          { count: 1, timeBucket: asset3.fileCreatedAt.toISOString() },
          { count: 2, timeBucket: asset1.fileCreatedAt.toISOString() },
        ]),
      );
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
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: asset1.id }),
          expect.objectContaining({ id: asset2.id }),
        ]),
      );
    });
  });
});
