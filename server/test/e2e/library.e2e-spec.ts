import { IJobRepository, JobItem, JobItemHandler, LibraryResponseDto, LoginResponseDto, QueueName } from '@app/domain';
import { AppModule, LibraryController } from '@app/immich';
import { AssetType, LibraryType } from '@app/infra/entities';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { api } from '@test/api';
import path from 'path';
import { AppService } from 'src/microservices/app.service';
import { MetadataExtractionProcessor } from 'src/microservices/processors/metadata-extraction.processor';
import request from 'supertest';
import { errorStub, uuidStub } from '../fixtures';
import { db } from '../test-utils';

describe(`${LibraryController.name} (e2e)`, () => {
  const TEST_ASSET_PATH = path.normalize(`${__dirname}/../assets/`);
  const TEST_ASSET_TEMP_PATH = path.normalize(`${TEST_ASSET_PATH}/temp/`);

  let app: INestApplication;
  let server: any;
  let admin: LoginResponseDto;

  let _handler: JobItemHandler = () => Promise.resolve();

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

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [MetadataExtractionProcessor, AppService],
    })
      .overrideProvider(IJobRepository)
      .useValue({
        addHandler: (_queueName: QueueName, _concurrency: number, handler: JobItemHandler) => (_handler = handler),
        queue: (item: JobItem) => _handler(item),
        resume: jest.fn(),
        empty: jest.fn(),
        setConcurrency: jest.fn(),
        getQueueStatus: jest.fn(),
        getJobCounts: jest.fn(),
        pause: jest.fn(),
      } as IJobRepository)
      .compile();

    app = await moduleFixture.createNestApplication().init();
    server = app.getHttpServer();

    const appService = app.get(AppService);
    await appService.init();
  });

  beforeEach(async () => {
    await db.reset();
    await api.authApi.adminSignUp(server);
    admin = await api.authApi.adminLogin(server);
  });

  afterAll(async () => {
    await db.disconnect();
    await app.close();
  });

  describe('GET /library', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get('/library');
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should start with a default upload library', async () => {
      const { status, body } = await request(server)
        .get('/library')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body).toEqual([
        expect.objectContaining({
          ownerId: admin.userId,
          type: LibraryType.UPLOAD,
          name: 'Default Library',
          refreshedAt: null,
          assetCount: 0,
          importPaths: [],
          exclusionPatterns: [],
        }),
      ]);
    });
  });

  describe('POST /library', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).post('/library').send({});
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    describe('external library', () => {
      it('with default settings', async () => {
        const { status, body } = await request(server)
          .post('/library')
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ type: LibraryType.EXTERNAL });
        expect(status).toBe(201);

        expect(body).toEqual(
          expect.objectContaining({
            ownerId: admin.userId,
            type: LibraryType.EXTERNAL,
            name: 'New External Library',
            refreshedAt: null,
            assetCount: 0,
            importPaths: [],
            exclusionPatterns: [],
          }),
        );
      });

      it('with name', async () => {
        const { status, body } = await request(server)
          .post('/library')
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ type: LibraryType.EXTERNAL, name: 'My Awesome Library' });
        expect(status).toBe(201);

        expect(body).toEqual(
          expect.objectContaining({
            name: 'My Awesome Library',
          }),
        );
      });

      it('with import paths', async () => {
        const { status, body } = await request(server)
          .post('/library')
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ type: LibraryType.EXTERNAL, importPaths: ['/path/to/import'] });
        expect(status).toBe(201);

        expect(body).toEqual(
          expect.objectContaining({
            importPaths: ['/path/to/import'],
          }),
        );
      });

      it('with exclusion patterns', async () => {
        const { status, body } = await request(server)
          .post('/library')
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ type: LibraryType.EXTERNAL, exclusionPatterns: ['**/Raw/**'] });
        expect(status).toBe(201);

        expect(body).toEqual(
          expect.objectContaining({
            exclusionPatterns: ['**/Raw/**'],
          }),
        );
      });
    });

    describe('upload library', () => {
      it('with default settings', async () => {
        const { status, body } = await request(server)
          .post('/library')
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ type: LibraryType.UPLOAD });
        expect(status).toBe(201);

        expect(body).toEqual(
          expect.objectContaining({
            ownerId: admin.userId,
            type: LibraryType.UPLOAD,
            name: 'New Upload Library',
            refreshedAt: null,
            assetCount: 0,
            importPaths: [],
            exclusionPatterns: [],
          }),
        );
      });

      it('with name', async () => {
        const { status, body } = await request(server)
          .post('/library')
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ type: LibraryType.UPLOAD, name: 'My Awesome Library' });
        expect(status).toBe(201);

        expect(body).toEqual(
          expect.objectContaining({
            name: 'My Awesome Library',
          }),
        );
      });

      it('with import paths should fail', async () => {
        const { status, body } = await request(server)
          .post('/library')
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ type: LibraryType.UPLOAD, importPaths: ['/path/to/import'] });
        expect(status).toBe(400);

        expect(body).toEqual(errorStub.badRequest('Upload libraries cannot have import paths'));
      });

      it('with exclusion patterns should fail', async () => {
        const { status, body } = await request(server)
          .post('/library')
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ type: LibraryType.UPLOAD, exclusionPatterns: ['**/Raw/**'] });
        expect(status).toBe(400);

        expect(body).toEqual(errorStub.badRequest('Upload libraries cannot have exclusion patterns'));
      });
    });

    it('should allow a user to create a library', async () => {
      await api.userApi.create(server, admin.accessToken, user1Dto);
      const user1 = await api.authApi.login(server, { email: user1Dto.email, password: user1Dto.password });

      const { status, body } = await request(server)
        .post('/library')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ type: LibraryType.EXTERNAL });

      expect(status).toBe(201);
      expect(body).toEqual(
        expect.objectContaining({
          ownerId: user1.userId,
          type: LibraryType.EXTERNAL,
          name: 'New External Library',
          refreshedAt: null,
          assetCount: 0,
          importPaths: [],
          exclusionPatterns: [],
        }),
      );
    });
  });

  describe('PUT /library/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).put(`/library/${uuidStub.notFound}`).send({});
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    describe('external library', () => {
      let library: LibraryResponseDto;

      beforeEach(async () => {
        // Create an external library with default settings
        library = await api.libraryApi.create(server, admin.accessToken, { type: LibraryType.EXTERNAL });
      });

      it('should change the library name', async () => {
        const { status, body } = await request(server)
          .put(`/library/${library.id}`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ name: 'New Library Name' });

        expect(status).toBe(200);
        expect(body).toEqual(
          expect.objectContaining({
            name: 'New Library Name',
          }),
        );
      });

      it('should not set an empty name', async () => {
        const { status, body } = await request(server)
          .put(`/library/${library.id}`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ name: '' });

        expect(status).toBe(400);
        expect(body).toEqual(errorStub.badRequest(['name should not be empty']));
      });

      it('should change the import paths', async () => {
        const { status, body } = await request(server)
          .put(`/library/${library.id}`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ importPaths: ['/path/to/import'] });

        expect(status).toBe(200);
        expect(body).toEqual(
          expect.objectContaining({
            importPaths: ['/path/to/import'],
          }),
        );
      });

      it('should not allow an empty import path', async () => {
        const { status, body } = await request(server)
          .put(`/library/${library.id}`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ importPaths: [''] });

        expect(status).toBe(400);
        expect(body).toEqual(errorStub.badRequest(['each value in importPaths should not be empty']));
      });

      it('should change the exclusion pattern', async () => {
        const { status, body } = await request(server)
          .put(`/library/${library.id}`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ exclusionPatterns: ['**/Raw/**'] });

        expect(status).toBe(200);
        expect(body).toEqual(
          expect.objectContaining({
            exclusionPatterns: ['**/Raw/**'],
          }),
        );
      });

      it('should not allow an empty exclusion pattern', async () => {
        const { status, body } = await request(server)
          .put(`/library/${library.id}`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ exclusionPatterns: [''] });

        expect(status).toBe(400);
        expect(body).toEqual(errorStub.badRequest(['each value in exclusionPatterns should not be empty']));
      });
    });
  });

  describe('GET /library/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get(`/library/${uuidStub.notFound}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should get library by id', async () => {
      const library = await api.libraryApi.create(server, admin.accessToken, { type: LibraryType.EXTERNAL });

      const { status, body } = await request(server)
        .get(`/library/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          ownerId: admin.userId,
          type: LibraryType.EXTERNAL,
          name: 'New External Library',
          refreshedAt: null,
          assetCount: 0,
          importPaths: [],
          exclusionPatterns: [],
        }),
      );
    });

    it("should not allow getting another user's library", async () => {
      await api.userApi.create(server, admin.accessToken, user1Dto);
      const user1 = await api.authApi.login(server, { email: user1Dto.email, password: user1Dto.password });

      await api.userApi.create(server, admin.accessToken, user2Dto);
      const user2 = await api.authApi.login(server, { email: user2Dto.email, password: user2Dto.password });

      const library = await api.libraryApi.create(server, user1.accessToken, { type: LibraryType.EXTERNAL });

      const { status, body } = await request(server)
        .get(`/library/${library.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest('Not found or no library.read access'));
    });
  });

  describe('DELETE /library/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).delete(`/library/${uuidStub.notFound}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should not delete the last upload library', async () => {
      const [defaultLibrary] = await api.libraryApi.getAll(server, admin.accessToken);
      expect(defaultLibrary).toBeDefined();

      const { status, body } = await request(server)
        .delete(`/library/${defaultLibrary.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.noDeleteUploadLibrary);
    });
  });

  describe('GET /library/:id/statistics', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get(`/library/${uuidStub.notFound}/statistics`);

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });
  });

  describe('POST /library/:id/scan', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).post(`/library/${uuidStub.notFound}/scan`).send({});

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should scan external library with import paths', async () => {
      const library = await api.libraryApi.create(server, admin.accessToken, {
        type: LibraryType.EXTERNAL,
        importPaths: [`${TEST_ASSET_PATH}/albums/nature`],
      });
      await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/');

      const { status, body } = await request(server)
        .post(`/library/${library.id}/scan`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(201);
      expect(body).toEqual({});

      const assets = await api.assetApi.getAllAssets(server, admin.accessToken);

      expect(assets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: AssetType.IMAGE,
            originalFileName: 'el_torcal_rocks',
            libraryId: library.id,
            resized: true,
            thumbhash: expect.any(String),
            exifInfo: expect.objectContaining({
              exifImageWidth: 512,
              exifImageHeight: 341,
              latitude: null,
              longitude: null,
            }),
          }),
          expect.objectContaining({
            type: AssetType.IMAGE,
            originalFileName: 'silver_fir',
            libraryId: library.id,
            resized: true,
            thumbhash: expect.any(String),
            exifInfo: expect.objectContaining({
              exifImageWidth: 511,
              exifImageHeight: 323,
              latitude: null,
              longitude: null,
            }),
          }),
        ]),
      );
    });

    it('should scan external library with exclusion pattern', async () => {
      await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/not/a/real/path');

      const library = await api.libraryApi.create(server, admin.accessToken, {
        type: LibraryType.EXTERNAL,
        importPaths: [`${TEST_ASSET_PATH}/albums/nature`],
        exclusionPatterns: ['**/el_corcal*'],
      });

      await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/');

      const { status, body } = await request(server)
        .post(`/library/${library.id}/scan`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(201);
      expect(body).toEqual({});

      const assets = await api.assetApi.getAllAssets(server, admin.accessToken);

      expect(assets).toEqual(
        expect.arrayContaining([
          expect.not.objectContaining({
            // Excluded by exclusion pattern
            originalFileName: 'el_torcal_rocks',
          }),
          expect.objectContaining({
            type: AssetType.IMAGE,
            originalFileName: 'silver_fir',
            libraryId: library.id,
            resized: true,
            thumbhash: expect.any(String),
            exifInfo: expect.objectContaining({
              exifImageWidth: 511,
              exifImageHeight: 323,
              latitude: null,
              longitude: null,
            }),
          }),
        ]),
      );
    });

    it('should scan external library with import paths', async () => {
      const library = await api.libraryApi.create(server, admin.accessToken, {
        type: LibraryType.EXTERNAL,
        importPaths: [`${TEST_ASSET_PATH}/albums/nature`],
      });
      await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/');

      const { status, body } = await request(server)
        .post(`/library/${library.id}/scan`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(201);
      expect(body).toEqual({});

      const assets = await api.assetApi.getAllAssets(server, admin.accessToken);

      expect(assets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: AssetType.IMAGE,
            originalFileName: 'el_torcal_rocks',
            libraryId: library.id,
            resized: true,
            thumbhash: expect.any(String),
            exifInfo: expect.objectContaining({
              exifImageWidth: 512,
              exifImageHeight: 341,
              latitude: null,
              longitude: null,
            }),
          }),
          expect.objectContaining({
            type: AssetType.IMAGE,
            originalFileName: 'silver_fir',
            libraryId: library.id,
            resized: true,
            thumbhash: expect.any(String),
            exifInfo: expect.objectContaining({
              exifImageWidth: 511,
              exifImageHeight: 323,
              latitude: null,
              longitude: null,
            }),
          }),
        ]),
      );
    });

    describe('External path', () => {
      let library: LibraryResponseDto;

      beforeEach(async () => {
        library = await api.libraryApi.create(server, admin.accessToken, {
          type: LibraryType.EXTERNAL,
          importPaths: [`${TEST_ASSET_PATH}/albums/nature`],
        });
      });

      it('should not scan assets for user without external path', async () => {
        const { status, body } = await request(server)
          .post(`/library/${library.id}/scan`)
          .set('Authorization', `Bearer ${admin.accessToken}`);

        expect(status).toBe(201);
        expect(body).toEqual({});

        const assets = await api.assetApi.getAllAssets(server, admin.accessToken);

        expect(assets).toEqual([]);
      });

      it("should not import assets outside of user's external path", async () => {
        await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/not/a/real/path');

        const { status, body } = await request(server)
          .post(`/library/${library.id}/scan`)
          .set('Authorization', `Bearer ${admin.accessToken}`);

        expect(status).toBe(201);
        expect(body).toEqual({});

        const assets = await api.assetApi.getAllAssets(server, admin.accessToken);

        expect(assets).toEqual([]);
      });

      it.each([`${TEST_ASSET_PATH}/albums/nature`, `${TEST_ASSET_PATH}/albums/nature/`])(
        'should scan external library with external path %s',
        async (externalPath: string) => {
          await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, externalPath);

          const { status, body } = await request(server)
            .post(`/library/${library.id}/scan`)
            .set('Authorization', `Bearer ${admin.accessToken}`);

          expect(status).toBe(201);
          expect(body).toEqual({});

          const assets = await api.assetApi.getAllAssets(server, admin.accessToken);

          expect(assets).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                type: AssetType.IMAGE,
                originalFileName: 'el_torcal_rocks',
                libraryId: library.id,
                resized: true,
                thumbhash: expect.any(String),
                exifInfo: expect.objectContaining({
                  exifImageWidth: 512,
                  exifImageHeight: 341,
                  latitude: null,
                  longitude: null,
                }),
              }),
              expect.objectContaining({
                type: AssetType.IMAGE,
                originalFileName: 'silver_fir',
                libraryId: library.id,
                resized: true,
                thumbhash: expect.any(String),
                exifInfo: expect.objectContaining({
                  exifImageWidth: 511,
                  exifImageHeight: 323,
                  latitude: null,
                  longitude: null,
                }),
              }),
            ]),
          );
        },
      );
    });

    it('should not scan an upload library', async () => {
      const library = await api.libraryApi.create(server, admin.accessToken, {
        type: LibraryType.UPLOAD,
      });

      const { status, body } = await request(server)
        .post(`/library/${library.id}/scan`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest('Can only refresh external libraries'));
    });
  });

  describe('POST /library/:id/removeOffline', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).post(`/library/${uuidStub.notFound}/removeOffline`).send({});

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });
  });
});
