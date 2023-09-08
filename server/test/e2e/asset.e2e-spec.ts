import { IAssetRepository, LoginResponseDto } from '@app/domain';
import { AppModule, AssetController } from '@app/immich';
import { AssetEntity, AssetType } from '@app/infra/entities';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomBytes } from 'crypto';
import request from 'supertest';
import { errorStub, uuidStub } from '../fixtures';
import { api, db } from '../test-utils/test-utils';

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
const createAsset = (repository: IAssetRepository, loginResponse: LoginResponseDto): Promise<AssetEntity> => {
  const id = assetCount++;
  return repository.save({
    ownerId: loginResponse.userId,
    checksum: randomBytes(20),
    originalPath: `/tests/test_${id}`,
    deviceAssetId: `test_${id}`,
    deviceId: 'e2e-test',
    fileCreatedAt: new Date(),
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

    await api.userApi.create(server, admin.accessToken, user1Dto);
    user1 = await api.authApi.login(server, { email: user1Dto.email, password: user1Dto.password });
    asset1 = await createAsset(assetRepository, user1);

    await api.userApi.create(server, admin.accessToken, user2Dto);
    user2 = await api.authApi.login(server, { email: user2Dto.email, password: user2Dto.password });
    asset2 = await createAsset(assetRepository, user2);
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
      it(`should: ${should}`, async () => {
        const { status, body } = await request(server)
          .post('/asset/upload')
          .set('Authorization', `Bearer ${user1.accessToken}`)
          .attach('assetData', randomBytes(32), 'example.jpg')
          .field(dto);
        expect(status).toBe(400);
        expect(body).toEqual(errorStub.badRequest);
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
      await api.assetApi.upload(server, user1.accessToken, 'example-image', content);
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
      expect(body).toEqual(errorStub.badRequest);
    });

    it('should require access', async () => {
      const { status, body } = await request(server)
        .put(`/asset/${asset2.id}`)
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

    // Not possible because there is no local file that can be served.
    // it('should download file', async () => {
    //   const response = await request(server)
    //     .post(`/asset/download/${asset1.id}`)
    //     .set('Authorization', `Bearer ${user1.accessToken}`);

    //   expect(response.status).toBe(201);
    //   expect(response.headers['content-type']).toEqual('image/jpg');
    // });
  });
});
