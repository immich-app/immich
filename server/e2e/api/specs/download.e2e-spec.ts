import { AssetResponseDto, IAssetRepository, LibraryResponseDto, LoginResponseDto, mapAsset } from '@app/domain';
import { AssetController } from '@app/immich';
import { AssetEntity } from '@app/infra/entities';
import { INestApplication } from '@nestjs/common';
import { errorStub, userDto } from '@test/fixtures';
import request from 'supertest';
import { api } from '../../client';
import { generateAsset, testApp } from '../utils';

describe(`${AssetController.name} (e2e)`, () => {
  let app: INestApplication;
  let server: any;
  let assetRepository: IAssetRepository;
  let user1: LoginResponseDto;
  let libraries: LibraryResponseDto[];
  let asset1: AssetResponseDto;

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

    await api.userApi.create(server, admin.accessToken, userDto.user1);
    user1 = await api.authApi.login(server, userDto.user1);
    libraries = await api.libraryApi.getAll(server, user1.accessToken);
    asset1 = await createAsset(user1, new Date('1970-01-01'));
  });

  afterAll(async () => {
    await testApp.teardown();
  });

  describe('POST /download/info', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server)
        .post(`/download/info`)
        .send({ assetIds: [asset1.id] });

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should download info', async () => {
      const { status, body } = await request(server)
        .post('/download/info')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [asset1.id] });

      expect(status).toBe(201);
      expect(body).toEqual(expect.objectContaining({ archives: [expect.objectContaining({ assetIds: [asset1.id] })] }));
    });
  });

  describe('POST /download/asset/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).post(`/download/asset/${asset1.id}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should download file', async () => {
      const asset = await api.assetApi.upload(server, user1.accessToken, 'example');
      const response = await request(server)
        .post(`/download/asset/${asset.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toEqual('image/jpeg');
    });
  });
});
