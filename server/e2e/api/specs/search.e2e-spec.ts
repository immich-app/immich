import {
  AssetResponseDto,
  IAssetRepository,
  ISearchRepository,
  LibraryResponseDto,
  LoginResponseDto,
  mapAsset,
} from '@app/domain';
import { SearchController } from '@app/immich';
import { INestApplication } from '@nestjs/common';
import { errorStub, searchStub } from '@test/fixtures';
import request from 'supertest';
import { api } from '../../client';
import { generateAsset, testApp } from '../utils';

describe(`${SearchController.name}`, () => {
  let app: INestApplication;
  let server: any;
  let loginResponse: LoginResponseDto;
  let accessToken: string;
  let libraries: LibraryResponseDto[];
  let assetRepository: IAssetRepository;
  let smartInfoRepository: ISearchRepository;
  let asset1: AssetResponseDto;

  beforeAll(async () => {
    app = await testApp.create();
    server = app.getHttpServer();
    assetRepository = app.get<IAssetRepository>(IAssetRepository);
    smartInfoRepository = app.get<ISearchRepository>(ISearchRepository);
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
  });

  describe('GET /search (exif)', () => {
    beforeEach(async () => {
      const { id: assetId } = await assetRepository.create(generateAsset(loginResponse.userId, libraries));
      await assetRepository.upsertExif({ assetId, ...searchStub.exif });

      const assetWithMetadata = await assetRepository.getById(assetId, { exifInfo: true });
      if (!assetWithMetadata) {
        throw new Error('Asset not found');
      }
      asset1 = mapAsset(assetWithMetadata);
    });

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
  });

  describe('GET /search (smart info)', () => {
    beforeEach(async () => {
      const { id: assetId } = await assetRepository.create(generateAsset(loginResponse.userId, libraries));
      await assetRepository.upsertExif({ assetId, ...searchStub.exif });
      await smartInfoRepository.upsert({ assetId, ...searchStub.smartInfo }, Array.from({ length: 512 }, Math.random));

      const assetWithMetadata = await assetRepository.getById(assetId, { exifInfo: true, smartInfo: true });
      if (!assetWithMetadata) {
        throw new Error('Asset not found');
      }
      asset1 = mapAsset(assetWithMetadata);
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

  describe('GET /search (file name)', () => {
    beforeEach(async () => {
      const { id: assetId } = await assetRepository.create(generateAsset(loginResponse.userId, libraries));
      await assetRepository.upsertExif({ assetId, ...searchStub.exif });

      const assetWithMetadata = await assetRepository.getById(assetId, { exifInfo: true });
      if (!assetWithMetadata) {
        throw new Error('Asset not found');
      }
      asset1 = mapAsset(assetWithMetadata);
    });

    it('should return assets when searching by file name', async () => {
      if (asset1?.originalFileName.length === 0) {
        throw new Error('Asset 1 does not have an original file name');
      }

      const { status, body } = await request(server)
        .get('/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ q: asset1.originalFileName });

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
              originalFileName: asset1.originalFileName,
            },
          ],
          facets: [],
        },
      });
    });

    it('should return assets when searching by file name with extension', async () => {
      if (asset1?.originalFileName.length === 0) {
        throw new Error('Asset 1 does not have an original file name');
      }

      const { status, body } = await request(server)
        .get('/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ q: asset1.originalFileName + '.jpg' });

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
              originalFileName: asset1.originalFileName,
            },
          ],
          facets: [],
        },
      });
    });
  });
});
