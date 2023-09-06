import { IAssetRepository, LoginResponseDto } from '@app/domain';
import { AppModule, AssetController } from '@app/immich';
import { AssetEntity, AssetType } from '@app/infra/entities';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomBytes } from 'crypto';
import request from 'supertest';
import { errorStub, uuidStub } from '../fixtures';
import { api, db } from '../test-utils';

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
    await api.adminSignUp(server);
    const admin = await api.adminLogin(server);

    await api.userApi.create(server, admin.accessToken, user1Dto);
    user1 = await api.login(server, { email: user1Dto.email, password: user1Dto.password });
    asset1 = await createAsset(assetRepository, user1);

    await api.userApi.create(server, admin.accessToken, user2Dto);
    user2 = await api.login(server, { email: user2Dto.email, password: user2Dto.password });
    asset2 = await createAsset(assetRepository, user2);
  });

  afterAll(async () => {
    await db.disconnect();
    await app.close();
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
});
