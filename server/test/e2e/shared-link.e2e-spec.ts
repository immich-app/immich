import { AlbumResponseDto, LoginResponseDto, SharedLinkResponseDto } from '@app/domain';
import { AppModule, PartnerController } from '@app/immich';
import { SharedLinkType } from '@app/infra/entities';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { api } from '@test/api';
import { db } from '@test/db';
import { errorStub, uuidStub } from '@test/fixtures';
import request from 'supertest';

const user1Dto = {
  email: 'user1@immich.app',
  password: 'Password123',
  firstName: 'User 1',
  lastName: 'Test',
};

describe(`${PartnerController.name} (e2e)`, () => {
  let app: INestApplication;
  let server: any;
  let loginResponse: LoginResponseDto;
  let accessToken: string;
  let user1: LoginResponseDto;
  let album: AlbumResponseDto;
  let sharedLink: SharedLinkResponseDto;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await moduleFixture.createNestApplication().init();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await db.reset();
    await api.authApi.adminSignUp(server);
    loginResponse = await api.authApi.adminLogin(server);
    accessToken = loginResponse.accessToken;

    await api.userApi.create(server, accessToken, user1Dto);
    user1 = await api.authApi.login(server, { email: user1Dto.email, password: user1Dto.password });

    album = await api.albumApi.create(server, user1.accessToken, { albumName: 'shared with link' });
    sharedLink = await api.sharedLinkApi.create(server, user1.accessToken, {
      type: SharedLinkType.ALBUM,
      albumId: album.id,
    });
  });

  afterAll(async () => {
    await db.disconnect();
    await app.close();
  });

  describe('GET /shared-link', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get('/shared-link');

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should get all shared links created by user', async () => {
      const { status, body } = await request(server)
        .get('/shared-link')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual([expect.objectContaining({ album, userId: user1.userId, type: SharedLinkType.ALBUM })]);
    });

    it('should not get shared links created by other users', async () => {
      const { status, body } = await request(server).get('/shared-link').set('Authorization', `Bearer ${accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual([]);
    });
  });

  describe('GET /shared-link/me', () => {
    it('should not require admin authentication', async () => {
      const { status } = await request(server).get('/shared-link/me').set('Authorization', `Bearer ${accessToken}`);

      expect(status).toBe(403);
    });

    it('should get data for correct shared link', async () => {
      const { status, body } = await request(server).get('/shared-link/me').query({ key: sharedLink.key });

      expect(status).toBe(200);
      expect(body).toEqual(expect.objectContaining({ album, userId: user1.userId, type: SharedLinkType.ALBUM }));
    });

    it('should return unauthorized for incorrect shared link', async () => {
      const { status, body } = await request(server)
        .get('/shared-link/me')
        .query({ key: sharedLink.key + 'foo' });

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.invalidShareKey);
    });

    it('should return unauthorized if target has been soft deleted', async () => {
      const softDeletedAlbum = await api.albumApi.create(server, user1.accessToken, { albumName: 'shared with link' });
      const softDeletedAlbumLink = await api.sharedLinkApi.create(server, user1.accessToken, {
        type: SharedLinkType.ALBUM,
        albumId: softDeletedAlbum.id,
      });
      await api.userApi.delete(server, accessToken, user1.userId);

      const { status, body } = await request(server).get('/shared-link/me').query({ key: softDeletedAlbumLink.key });

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.invalidShareKey);
    });
  });

  describe('GET /shared-link/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get(`/shared-link/${sharedLink.id}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should get shared link by id', async () => {
      const { status, body } = await request(server)
        .get(`/shared-link/${sharedLink.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual(expect.objectContaining({ album, userId: user1.userId, type: SharedLinkType.ALBUM }));
    });

    it('should not get shared link by id if user has not created the link or it does not exist', async () => {
      const { status, body } = await request(server)
        .get(`/shared-link/${sharedLink.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(expect.objectContaining({ message: 'Shared link not found' }));
    });
  });

  describe('POST /shared-link', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server)
        .post('/shared-link')
        .send({ type: SharedLinkType.ALBUM, albumId: uuidStub.notFound });

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should require a type and the correspondent asset/album id', async () => {
      const { status, body } = await request(server)
        .post('/shared-link')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest());
    });

    it('should require an asset/album id', async () => {
      const { status, body } = await request(server)
        .post('/shared-link')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ type: SharedLinkType.ALBUM });

      expect(status).toBe(400);
      expect(body).toEqual(expect.objectContaining({ message: 'Invalid albumId' }));
    });

    it('should require a valid asset id', async () => {
      const { status, body } = await request(server)
        .post('/shared-link')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ type: SharedLinkType.INDIVIDUAL, assetId: uuidStub.notFound });

      expect(status).toBe(400);
      expect(body).toEqual(expect.objectContaining({ message: 'Invalid assetIds' }));
    });

    it('should create a shared link', async () => {
      const { status, body } = await request(server)
        .post('/shared-link')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ type: SharedLinkType.ALBUM, albumId: album.id });

      expect(status).toBe(201);
      expect(body).toEqual(expect.objectContaining({ type: SharedLinkType.ALBUM, userId: user1.userId }));
    });
  });

  describe('PATCH /shared-link/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server)
        .patch(`/shared-link/${sharedLink.id}`)
        .send({ description: 'foo' });

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should fail if invalid link', async () => {
      const { status, body } = await request(server)
        .patch(`/shared-link/${uuidStub.notFound}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ description: 'foo' });

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest());
    });

    it('should update shared link', async () => {
      const { status, body } = await request(server)
        .patch(`/shared-link/${sharedLink.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ description: 'foo' });

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({ type: SharedLinkType.ALBUM, userId: user1.userId, description: 'foo' }),
      );
    });
  });

  describe('DELETE /shared-link/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).delete(`/shared-link/${sharedLink.id}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should fail if invalid link', async () => {
      const { status, body } = await request(server)
        .delete(`/shared-link/${uuidStub.notFound}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest());
    });

    it('should update shared link', async () => {
      const { status } = await request(server)
        .delete(`/shared-link/${sharedLink.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
    });
  });
});
