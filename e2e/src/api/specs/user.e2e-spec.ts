import { LoginResponseDto, SharedLinkType, deleteUserAdmin, getMyUser, login } from '@immich/sdk';
import { createUserDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/users', () => {
  let admin: LoginResponseDto;
  let deletedUser: LoginResponseDto;
  let nonAdmin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup({ onboarding: false });

    [deletedUser, nonAdmin] = await Promise.all([
      utils.userSetup(admin.accessToken, createUserDto.user1),
      utils.userSetup(admin.accessToken, createUserDto.user2),
    ]);

    await deleteUserAdmin(
      { id: deletedUser.userId, userAdminDeleteDto: {} },
      { headers: asBearerAuth(admin.accessToken) },
    );
  });

  describe('GET /users', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/users');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should get users', async () => {
      const { status, body } = await request(app).get('/users').set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toEqual(200);
      expect(body).toHaveLength(2);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: 'admin@immich.cloud' }),
          expect.objectContaining({ email: 'user2@immich.cloud' }),
        ]),
      );
    });
  });

  describe('GET /users/me', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get(`/users/me`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should not work for shared links', async () => {
      const album = await utils.createAlbum(admin.accessToken, { albumName: 'Album' });
      const sharedLink = await utils.createSharedLink(admin.accessToken, {
        type: SharedLinkType.Album,
        albumId: album.id,
      });
      const { status, body } = await request(app).get(`/users/me?key=${sharedLink.key}`);
      expect(status).toBe(403);
      expect(body).toEqual(errorDto.forbidden);
    });

    it('should get my user', async () => {
      const { status, body } = await request(app).get(`/users/me`).set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toMatchObject({
        id: admin.userId,
        email: 'admin@immich.cloud',
        memoriesEnabled: true,
        quotaUsageInBytes: 0,
      });
    });
  });

  describe('PUT /users/me', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put(`/users/me`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    for (const key of ['email', 'name', 'memoriesEnabled', 'avatarColor']) {
      it(`should not allow null ${key}`, async () => {
        const dto = { [key]: null };
        const { status, body } = await request(app)
          .put(`/users/me`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send(dto);
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest());
      });
    }

    it('should update first and last name', async () => {
      const before = await getMyUser({ headers: asBearerAuth(admin.accessToken) });

      const { status, body } = await request(app)
        .put(`/users/me`)
        .send({ name: 'Name' })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual({
        ...before,
        updatedAt: expect.any(String),
        name: 'Name',
      });
    });

    it('should update memories enabled', async () => {
      const before = await getMyUser({ headers: asBearerAuth(admin.accessToken) });
      const { status, body } = await request(app)
        .put(`/users/me`)
        .send({ memoriesEnabled: false })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toMatchObject({
        ...before,
        updatedAt: expect.anything(),
        memoriesEnabled: false,
      });

      const after = await getMyUser({ headers: asBearerAuth(admin.accessToken) });
      expect(after.memoriesEnabled).toBe(false);
    });

    /** @deprecated */
    it('should allow a user to change their password (deprecated)', async () => {
      const user = await getMyUser({ headers: asBearerAuth(nonAdmin.accessToken) });

      expect(user.shouldChangePassword).toBe(true);

      const { status, body } = await request(app)
        .put(`/users/me`)
        .send({ password: 'super-secret' })
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toMatchObject({
        email: nonAdmin.userEmail,
        shouldChangePassword: false,
      });

      const token = await login({ loginCredentialDto: { email: nonAdmin.userEmail, password: 'super-secret' } });

      expect(token.accessToken).toBeDefined();
    });

    it('should not allow user to change to a taken email', async () => {
      const { status, body } = await request(app)
        .put(`/users/me`)
        .send({ email: 'admin@immich.cloud' })
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`);

      expect(status).toBe(400);
      expect(body).toMatchObject(errorDto.badRequest('Email already in use by another account'));
    });

    it('should update my email', async () => {
      const before = await getMyUser({ headers: asBearerAuth(nonAdmin.accessToken) });
      const { status, body } = await request(app)
        .put(`/users/me`)
        .send({ email: 'non-admin@immich.cloud' })
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toMatchObject({
        ...before,
        email: 'non-admin@immich.cloud',
        updatedAt: expect.anything(),
      });
    });
  });

  describe('GET /users/:id', () => {
    it('should require authentication', async () => {
      const { status } = await request(app).get(`/users/${admin.userId}`);
      expect(status).toEqual(401);
    });

    it('should get the user', async () => {
      const { status, body } = await request(app)
        .get(`/users/${admin.userId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toMatchObject({
        id: admin.userId,
        email: 'admin@immich.cloud',
      });

      expect(body).not.toMatchObject({
        shouldChangePassword: expect.anything(),
        memoriesEnabled: expect.anything(),
        storageLabel: expect.anything(),
      });
    });
  });
});
