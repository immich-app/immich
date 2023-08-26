import { LoginResponseDto } from '@app/domain';
import { AppModule, LibraryController } from '@app/immich';
import { LibraryType } from '@app/infra/entities';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { errorStub, uuidStub } from '../fixtures';
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
      expect(body[0]).toEqual({
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
      });
    });
  });

  describe('POST /library', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).post('/library').send({});
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });
  });

  describe('PUT /library', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).put('/library').send({});
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });
  });

  describe('GET /library/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get(`/library/${uuidStub.notFound}`);
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
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
});
