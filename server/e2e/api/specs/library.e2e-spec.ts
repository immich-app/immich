import { LibraryResponseDto, LoginResponseDto } from '@app/domain';
import { LibraryController } from '@app/immich';
import { LibraryType } from '@app/infra/entities';
import { errorStub, userDto, uuidStub } from '@test/fixtures';
import request from 'supertest';
import { api } from '../../client';
import { testApp } from '../utils';

describe(`${LibraryController.name} (e2e)`, () => {
  let server: any;
  let admin: LoginResponseDto;

  beforeAll(async () => {
    server = (await testApp.create()).getHttpServer();
  });

  afterAll(async () => {
    await testApp.teardown();
  });

  beforeEach(async () => {
    await testApp.reset();
    await api.authApi.adminSignUp(server);
    admin = await api.authApi.adminLogin(server);
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

    it('should create an external library with defaults', async () => {
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

    it('should create an external library with options', async () => {
      const { status, body } = await request(server)
        .post('/library')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          type: LibraryType.EXTERNAL,
          name: 'My Awesome Library',
          importPaths: ['/path/to/import'],
          exclusionPatterns: ['**/Raw/**'],
        });

      expect(status).toBe(201);
      expect(body).toEqual(
        expect.objectContaining({
          name: 'My Awesome Library',
          importPaths: ['/path/to/import'],
        }),
      );
    });

    it('should not create an external library with duplicate import paths', async () => {
      const { status, body } = await request(server)
        .post('/library')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          type: LibraryType.EXTERNAL,
          name: 'My Awesome Library',
          importPaths: ['/path', '/path'],
          exclusionPatterns: ['**/Raw/**'],
        });

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest(["All importPaths's elements must be unique"]));
    });

    it('should not create an external library with duplicate exclusion patterns', async () => {
      const { status, body } = await request(server)
        .post('/library')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          type: LibraryType.EXTERNAL,
          name: 'My Awesome Library',
          importPaths: ['/path/to/import'],
          exclusionPatterns: ['**/Raw/**', '**/Raw/**'],
        });

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest(["All exclusionPatterns's elements must be unique"]));
    });

    it('should create an upload library with defaults', async () => {
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

    it('should create an upload library with options', async () => {
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

    it('should not allow upload libraries to have import paths', async () => {
      const { status, body } = await request(server)
        .post('/library')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ type: LibraryType.UPLOAD, importPaths: ['/path/to/import'] });

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest('Upload libraries cannot have import paths'));
    });

    it('should not allow upload libraries to have exclusion patterns', async () => {
      const { status, body } = await request(server)
        .post('/library')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ type: LibraryType.UPLOAD, exclusionPatterns: ['**/Raw/**'] });

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest('Upload libraries cannot have exclusion patterns'));
    });

    it('should allow a non-admin to create a library', async () => {
      await api.userApi.create(server, admin.accessToken, userDto.user1);
      const user1 = await api.authApi.login(server, userDto.user1);

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

      it('should reject an empty import path', async () => {
        const { status, body } = await request(server)
          .put(`/library/${library.id}`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ importPaths: [''] });

        expect(status).toBe(400);
        expect(body).toEqual(errorStub.badRequest(['each value in importPaths should not be empty']));
      });

      it('should reject duplicate import paths', async () => {
        const { status, body } = await request(server)
          .put(`/library/${library.id}`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ importPaths: ['/path', '/path'] });

        expect(status).toBe(400);
        expect(body).toEqual(errorStub.badRequest(["All importPaths's elements must be unique"]));
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

      it('should reject duplicate exclusion patterns', async () => {
        const { status, body } = await request(server)
          .put(`/library/${library.id}`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ exclusionPatterns: ['**/*.jpg', '**/*.jpg'] });

        expect(status).toBe(400);
        expect(body).toEqual(errorStub.badRequest(["All exclusionPatterns's elements must be unique"]));
      });

      it('should reject an empty exclusion pattern', async () => {
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
      await Promise.all([
        api.userApi.create(server, admin.accessToken, userDto.user1),
        api.userApi.create(server, admin.accessToken, userDto.user2),
      ]);

      const [user1, user2] = await Promise.all([
        api.authApi.login(server, userDto.user1),
        api.authApi.login(server, userDto.user2),
      ]);

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

    it('should delete an empty library', async () => {
      const library = await api.libraryApi.create(server, admin.accessToken, { type: LibraryType.EXTERNAL });

      const { status, body } = await request(server)
        .delete(`/library/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual({});

      const libraries = await api.libraryApi.getAll(server, admin.accessToken);
      expect(libraries).toHaveLength(1);
      expect(libraries).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: library.id,
          }),
        ]),
      );
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
  });

  describe('POST /library/:id/removeOffline', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).post(`/library/${uuidStub.notFound}/removeOffline`).send({});

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });
  });
});
