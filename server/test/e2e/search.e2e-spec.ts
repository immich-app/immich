import {
  AssetResponseDto,
  IAssetRepository,
  ISmartInfoRepository,
  LibraryResponseDto,
  LoginResponseDto,
  mapAsset,
} from '@app/domain';
import { SearchController } from '@app/immich';
import { INestApplication } from '@nestjs/common';
import { api } from '@test/api';
import { errorStub } from '@test/fixtures';
import { generateAsset, testApp } from '@test/test-utils';
import request from 'supertest';

describe(`${SearchController.name}`, () => {
  let app: INestApplication;
  let server: any;
  let loginResponse: LoginResponseDto;
  let accessToken: string;
  let libraries: LibraryResponseDto[];
  let assetRepository: IAssetRepository;
  let smartInfoRepository: ISmartInfoRepository;
  let asset1: AssetResponseDto;

  beforeAll(async () => {
    [server, app] = await testApp.create();
    assetRepository = app.get<IAssetRepository>(IAssetRepository);
    smartInfoRepository = app.get<ISmartInfoRepository>(ISmartInfoRepository);
  });

  afterAll(async () => {
    await testApp.teardown();
  });

  beforeEach(async () => {
    await testApp.reset();
    await api.authApi.adminSignUp(server);
    loginResponse = await api.authApi.adminLogin(server);
    accessToken = loginResponse.accessToken;
    libraries = await api.libraryApi.getAll(server, accessToken);

    const assetId = (await assetRepository.create(generateAsset(loginResponse.userId, libraries))).id;
    await assetRepository.upsertExif({
      assetId,
      latitude: 90,
      longitude: 90,
      city: 'Immich',
      state: 'Nebraska',
      country: 'United States',
      make: 'Canon',
      model: 'EOS Rebel T7',
      lensModel: 'Fancy lens',
    });
    await smartInfoRepository.upsert(
      { assetId, objects: ['car', 'tree'], tags: ['accident'] },
      Array.from({ length: 512 }, Math.random),
    );
    const assetWithMetadata = await assetRepository.getById(assetId, { exifInfo: true, smartInfo: true });
    if (!assetWithMetadata) {
      throw new Error('Asset not found');
    }
    asset1 = mapAsset(assetWithMetadata);
  });

  describe('GET /search', () => {
    beforeEach(async () => {});

    it('should require authentication', async () => {
      const { status, body } = await request(server).get('/search');

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should return assets when searching by exif', async () => {
      if (!asset1?.exifInfo?.make) {
        throw new Error('Asset 1 does not have exif info');
      }

      const { status, body } = await request(server)
        .get('/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ q: asset1.exifInfo.make });

      expect(status).toBe(200);
      expect(body).toMatchObject({
        albums: {
          total: 0,
          count: 0,
          items: [],
          facets: [],
        },
        assets: {
          total: 1,
          count: 1,
          items: [
            {
              id: asset1.id,
              exifInfo: {
                make: asset1.exifInfo.make,
              },
            },
          ],
          facets: [],
        },
      });
    });

    it('should be case-insensitive for metadata search', async () => {
      if (!asset1?.exifInfo?.make) {
        throw new Error('Asset 1 does not have exif info');
      }

      const { status, body } = await request(server)
        .get('/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ q: asset1.exifInfo.make.toLowerCase() });

      expect(status).toBe(200);
      expect(body).toMatchObject({
        albums: {
          total: 0,
          count: 0,
          items: [],
          facets: [],
        },
        assets: {
          total: 1,
          count: 1,
          items: [
            {
              id: asset1.id,
              exifInfo: {
                make: asset1.exifInfo.make,
              },
            },
          ],
          facets: [],
        },
      });
    });

    it('should be whitespace-insensitive for metadata search', async () => {
      if (!asset1?.exifInfo?.make) {
        throw new Error('Asset 1 does not have exif info');
      }

      const { status, body } = await request(server)
        .get('/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ q: ` ${asset1.exifInfo.make}  ` });

      expect(status).toBe(200);
      expect(body).toMatchObject({
        albums: {
          total: 0,
          count: 0,
          items: [],
          facets: [],
        },
        assets: {
          total: 1,
          count: 1,
          items: [
            {
              id: asset1.id,
              exifInfo: {
                make: asset1.exifInfo.make,
              },
            },
          ],
          facets: [],
        },
      });
    });

    it('should return assets when searching by object', async () => {
      if (!asset1?.smartInfo?.objects) {
        throw new Error('Asset 1 does not have smart info');
      }

      const { status, body } = await request(server)
        .get('/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ q: asset1.smartInfo.objects[0] });

      expect(status).toBe(200);
      expect(body).toMatchObject({
        albums: {
          total: 0,
          count: 0,
          items: [],
          facets: [],
        },
        assets: {
          total: 1,
          count: 1,
          items: [
            {
              id: asset1.id,
              smartInfo: {
                objects: asset1.smartInfo.objects,
                tags: asset1.smartInfo.tags,
              },
            },
          ],
          facets: [],
        },
      });
    });
  });
});
