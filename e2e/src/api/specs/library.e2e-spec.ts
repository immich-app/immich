import { LibraryResponseDto, LibraryType, LoginResponseDto, getAllLibraries } from '@immich/sdk';
import { userDto, uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, testAssetDirInternal, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/library', () => {
  let admin: LoginResponseDto;
  let user: LoginResponseDto;
  let library: LibraryResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    user = await utils.userSetup(admin.accessToken, userDto.user1);
    library = await utils.createLibrary(admin.accessToken, { type: LibraryType.External });
  });

  describe('GET /library', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/library');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should start with a default upload library', async () => {
      const { status, body } = await request(app).get('/library').set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ownerId: admin.userId,
            type: LibraryType.Upload,
            name: 'Default Library',
            refreshedAt: null,
            assetCount: 0,
            importPaths: [],
            exclusionPatterns: [],
          }),
        ]),
      );
    });
  });

  describe('POST /library', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/library').send({});
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require admin authentication', async () => {
      const { status, body } = await request(app)
        .post('/library')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: LibraryType.External });

      expect(status).toBe(403);
      expect(body).toEqual(errorDto.forbidden);
    });

    it('should create an external library with defaults', async () => {
      const { status, body } = await request(app)
        .post('/library')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ type: LibraryType.External });

      expect(status).toBe(201);
      expect(body).toEqual(
        expect.objectContaining({
          ownerId: admin.userId,
          type: LibraryType.External,
          name: 'New External Library',
          refreshedAt: null,
          assetCount: 0,
          importPaths: [],
          exclusionPatterns: [],
        }),
      );
    });

    it('should create an external library with options', async () => {
      const { status, body } = await request(app)
        .post('/library')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          type: LibraryType.External,
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
      const { status, body } = await request(app)
        .post('/library')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          type: LibraryType.External,
          name: 'My Awesome Library',
          importPaths: ['/path', '/path'],
          exclusionPatterns: ['**/Raw/**'],
        });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(["All importPaths's elements must be unique"]));
    });

    it('should not create an external library with duplicate exclusion patterns', async () => {
      const { status, body } = await request(app)
        .post('/library')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          type: LibraryType.External,
          name: 'My Awesome Library',
          importPaths: ['/path/to/import'],
          exclusionPatterns: ['**/Raw/**', '**/Raw/**'],
        });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(["All exclusionPatterns's elements must be unique"]));
    });

    it('should create an upload library with defaults', async () => {
      const { status, body } = await request(app)
        .post('/library')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ type: LibraryType.Upload });

      expect(status).toBe(201);
      expect(body).toEqual(
        expect.objectContaining({
          ownerId: admin.userId,
          type: LibraryType.Upload,
          name: 'New Upload Library',
          refreshedAt: null,
          assetCount: 0,
          importPaths: [],
          exclusionPatterns: [],
        }),
      );
    });

    it('should create an upload library with options', async () => {
      const { status, body } = await request(app)
        .post('/library')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ type: LibraryType.Upload, name: 'My Awesome Library' });

      expect(status).toBe(201);
      expect(body).toEqual(
        expect.objectContaining({
          name: 'My Awesome Library',
        }),
      );
    });

    it('should not allow upload libraries to have import paths', async () => {
      const { status, body } = await request(app)
        .post('/library')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ type: LibraryType.Upload, importPaths: ['/path/to/import'] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Upload libraries cannot have import paths'));
    });

    it('should not allow upload libraries to have exclusion patterns', async () => {
      const { status, body } = await request(app)
        .post('/library')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ type: LibraryType.Upload, exclusionPatterns: ['**/Raw/**'] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Upload libraries cannot have exclusion patterns'));
    });
  });

  describe('PUT /library/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put(`/library/${uuidDto.notFound}`).send({});
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should change the library name', async () => {
      const { status, body } = await request(app)
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
      const { status, body } = await request(app)
        .put(`/library/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: '' });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['name should not be empty']));
    });

    it('should change the import paths', async () => {
      const { status, body } = await request(app)
        .put(`/library/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ importPaths: [testAssetDirInternal] });

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          importPaths: [testAssetDirInternal],
        }),
      );
    });

    it('should reject an empty import path', async () => {
      const { status, body } = await request(app)
        .put(`/library/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ importPaths: [''] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['each value in importPaths should not be empty']));
    });

    it('should reject duplicate import paths', async () => {
      const { status, body } = await request(app)
        .put(`/library/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ importPaths: ['/path', '/path'] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(["All importPaths's elements must be unique"]));
    });

    it('should change the exclusion pattern', async () => {
      const { status, body } = await request(app)
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
      const { status, body } = await request(app)
        .put(`/library/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ exclusionPatterns: ['**/*.jpg', '**/*.jpg'] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(["All exclusionPatterns's elements must be unique"]));
    });

    it('should reject an empty exclusion pattern', async () => {
      const { status, body } = await request(app)
        .put(`/library/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ exclusionPatterns: [''] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['each value in exclusionPatterns should not be empty']));
    });
  });

  describe('GET /library/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get(`/library/${uuidDto.notFound}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require admin access', async () => {
      const { status, body } = await request(app)
        .get(`/library/${uuidDto.notFound}`)
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(403);
      expect(body).toEqual(errorDto.forbidden);
    });

    it('should get library by id', async () => {
      const library = await utils.createLibrary(admin.accessToken, { type: LibraryType.External });

      const { status, body } = await request(app)
        .get(`/library/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          ownerId: admin.userId,
          type: LibraryType.External,
          name: 'New External Library',
          refreshedAt: null,
          assetCount: 0,
          importPaths: [],
          exclusionPatterns: [],
        }),
      );
    });
  });

  describe('DELETE /library/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).delete(`/library/${uuidDto.notFound}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should not delete the last upload library', async () => {
      const libraries = await getAllLibraries(
        { $type: LibraryType.Upload },
        { headers: asBearerAuth(admin.accessToken) },
      );

      const adminLibraries = libraries.filter((library) => library.ownerId === admin.userId);
      expect(adminLibraries.length).toBeGreaterThanOrEqual(1);
      const lastLibrary = adminLibraries.pop() as LibraryResponseDto;

      // delete all but the last upload library
      for (const library of adminLibraries) {
        const { status } = await request(app)
          .delete(`/library/${library.id}`)
          .set('Authorization', `Bearer ${admin.accessToken}`);
        expect(status).toBe(204);
      }

      const { status, body } = await request(app)
        .delete(`/library/${lastLibrary.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(body).toEqual(errorDto.noDeleteUploadLibrary);
      expect(status).toBe(400);
    });

    it('should delete an external library', async () => {
      const library = await utils.createLibrary(admin.accessToken, { type: LibraryType.External });

      const { status, body } = await request(app)
        .delete(`/library/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(204);
      expect(body).toEqual({});

      const libraries = await getAllLibraries({}, { headers: asBearerAuth(admin.accessToken) });
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
      const { status, body } = await request(app).get(`/library/${uuidDto.notFound}/statistics`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });
  });

  describe('POST /library/:id/scan', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post(`/library/${uuidDto.notFound}/scan`).send({});

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });
  });

  describe('POST /library/:id/removeOffline', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post(`/library/${uuidDto.notFound}/removeOffline`).send({});

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });
  });

  describe('POST /library/:id/validate', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post(`/library/${uuidDto.notFound}/validate`).send({});

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should pass with no import paths', async () => {
      const response = await utils.validateLibrary(admin.accessToken, library.id, { importPaths: [] });
      expect(response.importPaths).toEqual([]);
    });

    it('should fail if path does not exist', async () => {
      const pathToTest = `${testAssetDirInternal}/does/not/exist`;

      const response = await utils.validateLibrary(admin.accessToken, library.id, {
        importPaths: [pathToTest],
      });

      expect(response.importPaths?.length).toEqual(1);
      const pathResponse = response?.importPaths?.at(0);

      expect(pathResponse).toEqual({
        importPath: pathToTest,
        isValid: false,
        message: `Path does not exist (ENOENT)`,
      });
    });

    it('should fail if path is a file', async () => {
      const pathToTest = `${testAssetDirInternal}/albums/nature/el_torcal_rocks.jpg`;

      const response = await utils.validateLibrary(admin.accessToken, library.id, {
        importPaths: [pathToTest],
      });

      expect(response.importPaths?.length).toEqual(1);
      const pathResponse = response?.importPaths?.at(0);

      expect(pathResponse).toEqual({
        importPath: pathToTest,
        isValid: false,
        message: `Not a directory`,
      });
    });
  });
});
