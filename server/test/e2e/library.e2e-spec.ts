import { LoginResponseDto } from '@app/domain';
import { AppModule, LibraryController } from '@app/immich';
import { LibraryType } from '@app/infra/entities';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { errorStub, userStub, uuidStub } from '../fixtures';
import { api, db } from '../test-utils';

describe(`${LibraryController.name} (e2e)`, () => {
  let app: INestApplication;
  let server: any;
  let loginResponse: LoginResponseDto;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await moduleFixture.createNestApplication().init();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await db.reset();
    await api.adminSignUp(server);
    loginResponse = await api.adminLogin(server);
    accessToken = loginResponse.accessToken;
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
      const { status, body } = await request(server).get('/library').set('Authorization', `Bearer ${accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body).toEqual([
        {
          id: expect.any(String),
          ownerId: loginResponse.userId,
          type: LibraryType.UPLOAD,
          name: 'Default Library',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          refreshedAt: null,
          assetCount: 0,
          importPaths: [],
          exclusionPatterns: [],
        },
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
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ type: LibraryType.EXTERNAL });
        expect(status).toBe(201);

        expect(body).toEqual({
          id: expect.any(String),
          ownerId: loginResponse.userId,
          type: LibraryType.EXTERNAL,
          name: 'New External Library',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          refreshedAt: null,
          assetCount: 0,
          importPaths: [],
          exclusionPatterns: [],
        });
      });

      it('with name', async () => {
        const { status, body } = await request(server)
          .post('/library')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ type: LibraryType.EXTERNAL, name: 'My Awesome Library' });
        expect(status).toBe(201);

        expect(body).toEqual({
          id: expect.any(String),
          ownerId: loginResponse.userId,
          type: LibraryType.EXTERNAL,
          name: 'My Awesome Library',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          refreshedAt: null,
          assetCount: 0,
          importPaths: [],
          exclusionPatterns: [],
        });
      });

      it('with import paths', async () => {
        const { status, body } = await request(server)
          .post('/library')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ type: LibraryType.EXTERNAL, importPaths: ['/path/to/import'] });
        expect(status).toBe(201);

        expect(body).toEqual({
          id: expect.any(String),
          ownerId: loginResponse.userId,
          type: LibraryType.EXTERNAL,
          name: 'New External Library',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          refreshedAt: null,
          assetCount: 0,
          importPaths: ['/path/to/import'],
          exclusionPatterns: [],
        });
      });

      it('with exclusion patterns', async () => {
        const { status, body } = await request(server)
          .post('/library')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ type: LibraryType.EXTERNAL, exclusionPatterns: ['**/Raw/**'] });
        expect(status).toBe(201);

        expect(body).toEqual({
          id: expect.any(String),
          ownerId: loginResponse.userId,
          type: LibraryType.EXTERNAL,
          name: 'New External Library',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          refreshedAt: null,
          assetCount: 0,
          importPaths: [],
          exclusionPatterns: ['**/Raw/**'],
        });
      });
    });

    describe('upload library', () => {
      it('with default settings', async () => {
        const { status, body } = await request(server)
          .post('/library')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ type: LibraryType.UPLOAD });
        expect(status).toBe(201);

        expect(body).toEqual({
          id: expect.any(String),
          ownerId: loginResponse.userId,
          type: LibraryType.UPLOAD,
          name: 'New Upload Library',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          refreshedAt: null,
          assetCount: 0,
          importPaths: [],
          exclusionPatterns: [],
        });
      });

      it('with name', async () => {
        const { status, body } = await request(server)
          .post('/library')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ type: LibraryType.UPLOAD, name: 'My Awesome Library' });
        expect(status).toBe(201);

        expect(body).toEqual({
          id: expect.any(String),
          ownerId: loginResponse.userId,
          type: LibraryType.UPLOAD,
          name: 'My Awesome Library',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          refreshedAt: null,
          assetCount: 0,
          importPaths: [],
          exclusionPatterns: [],
        });
      });

      it('with import paths should fail', async () => {
        const { status, body } = await request(server)
          .post('/library')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ type: LibraryType.UPLOAD, importPaths: ['/path/to/import'] });
        expect(status).toBe(400);

        expect(body).toEqual(errorStub.badRequest('Upload libraries cannot have import paths'));
      });

      it('with exclusion patterns should fail', async () => {
        const { status, body } = await request(server)
          .post('/library')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ type: LibraryType.UPLOAD, exclusionPatterns: ['**/Raw/**'] });
        expect(status).toBe(400);

        expect(body).toEqual(errorStub.badRequest('Upload libraries cannot have exclusion patterns'));
      });
    });

    it('should allow a user to create a library', async () => {
      await api.userCreate(server, accessToken, userStub.user1);

      const loginResponse = await api.login(server, {
        email: userStub.user1.email,
        password: userStub.user1.password ?? '',
      });

      const { status, body } = await request(server)
        .post('/library')
        .set('Authorization', `Bearer ${loginResponse.accessToken}`)
        .send({ type: LibraryType.EXTERNAL });

      expect(status).toBe(201);
      expect(body).toEqual({
        id: expect.any(String),
        ownerId: loginResponse.userId,
        type: LibraryType.EXTERNAL,
        name: 'New External Library',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        refreshedAt: null,
        assetCount: 0,
        importPaths: [],
        exclusionPatterns: [],
      });
    });
  });

  describe('PUT /library/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).put(`/library/${uuidStub.notFound}`).send({});
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    describe('external library', () => {
      let libraryId: string;

      beforeEach(async () => {
        // Create an external library with default settings
        const { status, body } = await request(server)
          .post('/library')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ type: LibraryType.EXTERNAL });

        expect(status).toBe(201);

        libraryId = body.id;
      });

      it('should change the library name', async () => {
        const { status, body } = await request(server)
          .put(`/library/${libraryId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ name: 'New Library Name' });
        expect(status).toBe(200);
        expect(body).toEqual({
          id: expect.any(String),
          ownerId: loginResponse.userId,
          type: LibraryType.EXTERNAL,
          name: 'New Library Name',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          refreshedAt: null,
          assetCount: 0,
          importPaths: [],
          exclusionPatterns: [],
        });
      });

      it('should not set an empty name', async () => {
        const { status, body } = await request(server)
          .put(`/library/${libraryId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ name: '' });
        expect(status).toBe(400);
        expect(body).toEqual(errorStub.badRequest(['name should not be empty']));
      });

      it('should change the import paths', async () => {
        const { status, body } = await request(server)
          .put(`/library/${libraryId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ importPaths: ['/path/to/import'] });
        expect(status).toBe(200);
        expect(body).toEqual({
          id: expect.any(String),
          ownerId: loginResponse.userId,
          type: LibraryType.EXTERNAL,
          name: 'New External Library',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          refreshedAt: null,
          assetCount: 0,
          importPaths: ['/path/to/import'],
          exclusionPatterns: [],
        });
      });

      it('should not allow an empty import path', async () => {
        const { status, body } = await request(server)
          .put(`/library/${libraryId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ importPaths: [''] });
        expect(status).toBe(400);
        expect(body).toEqual(errorStub.badRequest(['each value in importPaths should not be empty']));
      });

      it('should change the exclusion pattern', async () => {
        const { status, body } = await request(server)
          .put(`/library/${libraryId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ exclusionPatterns: [''] });
        expect(status).toBe(400);
        expect(body).toEqual(errorStub.badRequest(['each value in exclusionPatterns should not be empty']));
      });

      it('should not allow an empty exclusion pattern', async () => {
        const { status, body } = await request(server)
          .put(`/library/${libraryId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ importPaths: [''] });
        expect(status).toBe(400);
        expect(body).toEqual(errorStub.badRequest(['each value in importPaths should not be empty']));
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
      let libraryId: string;
      {
        const { status, body } = await request(server)
          .post('/library')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ type: LibraryType.EXTERNAL });
        expect(status).toBe(201);
        libraryId = body.id;
      }
      const { status, body } = await request(server)
        .get(`/library/${libraryId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual({
        id: expect.any(String),
        ownerId: loginResponse.userId,
        type: LibraryType.EXTERNAL,
        name: 'New External Library',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        refreshedAt: null,
        assetCount: 0,
        importPaths: [],
        exclusionPatterns: [],
      });
    });

    it("should not allow getting another user's library", async () => {
      await api.userCreate(server, accessToken, userStub.user1);

      const loginResponse = await api.login(server, {
        email: userStub.user1.email,
        password: userStub.user1.password ?? '',
      });

      let libraryId: string;
      {
        const { status, body } = await request(server)
          .post('/library')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ type: LibraryType.EXTERNAL });
        expect(status).toBe(201);
        libraryId = body.id;
      }

      const { status, body } = await request(server)
        .get(`/library/${libraryId}`)
        .set('Authorization', `Bearer ${loginResponse.accessToken}`);

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
      const [defaultLibrary] = await api.libraryApi.getAll(server, accessToken);
      expect(defaultLibrary).toBeDefined();

      const { status, body } = await request(server)
        .delete(`/library/${defaultLibrary.id}`)
        .set('Authorization', `Bearer ${accessToken}`);
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

    it('should scan external library', async () => {
      let libraryId: string;
      {
        const { status, body } = await request(server)
          .post('/library')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ type: LibraryType.EXTERNAL });
        expect(status).toBe(201);
        libraryId = body.id;
      }

      const { status, body } = await request(server)
        .post(`/library/${libraryId}/scan`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(status).toBe(201);
      expect(body).toEqual({});
    });

    it('should not scan an upload library', async () => {
      let libraryId: string;
      {
        const { status, body } = await request(server)
          .post('/library')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ type: LibraryType.UPLOAD });
        expect(status).toBe(201);
        libraryId = body.id;
      }

      const { status, body } = await request(server)
        .post(`/library/${libraryId}/scan`)
        .set('Authorization', `Bearer ${accessToken}`);

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
