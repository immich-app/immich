import { LoginResponseDto, SharedLinkType, deleteUserAdmin, getMyPreferences, getMyUser, login } from '@immich/sdk';
import { createUserDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

const userLicense = {
  licenseKey: 'IMCL-FF69-TUK1-RWZU-V9Q8-QGQS-S5GC-X4R2-UFK4',
  activationKey:
    'KuX8KsktrBSiXpQMAH0zLgA5SpijXVr_PDkzLdWUlAogCTMBZ0I3KCHXK0eE9EEd7harxup8_EHMeqAWeHo5VQzol6LGECpFv585U9asXD4Zc-UXt3mhJr2uhazqipBIBwJA2YhmUCDy8hiyiGsukDQNu9Rg9C77UeoKuZBWVjWUBWG0mc1iRqfvF0faVM20w53czAzlhaMxzVGc3Oimbd7xi_CAMSujF_2y8QpA3X2fOVkQkzdcH9lV0COejl7IyH27zQQ9HrlrXv3Lai5Hw67kNkaSjmunVBxC5PS0TpKoc9SfBJMaAGWnaDbjhjYUrm-8nIDQnoeEAidDXVAdPw',
};

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

  describe('GET /users/me', () => {
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
        quotaUsageInBytes: 0,
      });
    });

    it('should get my user with license info', async () => {
      const { status: licenseStatus } = await request(app)
        .put(`/users/me/license`)
        .send(userLicense)
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`);
      expect(licenseStatus).toBe(200);
      const { status, body } = await request(app)
        .get(`/users/me`)
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toMatchObject({
        id: nonAdmin.userId,
        email: nonAdmin.userEmail,
        quotaUsageInBytes: 0,
        license: userLicense,
      });
    });
  });

  describe('PUT /users/me', () => {
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
        profileChangedAt: expect.any(String),
        createdAt: expect.any(String),
        name: 'Name',
      });
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
        createdAt: expect.anything(),
        profileChangedAt: expect.anything(),
      });
    });
  });

  describe('PUT /users/me/preferences', () => {
    it('should update memories enabled', async () => {
      const before = await getMyPreferences({ headers: asBearerAuth(admin.accessToken) });
      expect(before).toMatchObject({ memories: { enabled: true } });

      const { status, body } = await request(app)
        .put(`/users/me/preferences`)
        .send({ memories: { enabled: false } })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toMatchObject({ memories: { enabled: false } });

      const after = await getMyPreferences({ headers: asBearerAuth(admin.accessToken) });
      expect(after).toMatchObject({ memories: { enabled: false } });
    });

    it('should update avatar color', async () => {
      const { status, body } = await request(app)
        .put(`/users/me/preferences`)
        .send({ avatar: { color: 'blue' } })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toMatchObject({ avatar: { color: 'blue' } });

      const after = await getMyPreferences({ headers: asBearerAuth(admin.accessToken) });
      expect(after).toMatchObject({ avatar: { color: 'blue' } });
    });

    it('should require an integer for download archive size', async () => {
      const { status, body } = await request(app)
        .put(`/users/me/preferences`)
        .send({ download: { archiveSize: 1_234_567.89 } })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['download.archiveSize must be an integer number']));
    });

    it('should update download archive size', async () => {
      const before = await getMyPreferences({ headers: asBearerAuth(admin.accessToken) });
      expect(before).toMatchObject({ download: { archiveSize: 4 * 2 ** 30 } });

      const { status, body } = await request(app)
        .put(`/users/me/preferences`)
        .send({ download: { archiveSize: 1_234_567 } })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toMatchObject({ download: { archiveSize: 1_234_567 } });

      const after = await getMyPreferences({ headers: asBearerAuth(admin.accessToken) });
      expect(after).toMatchObject({ download: { archiveSize: 1_234_567 } });
    });

    it('should require a boolean for download include embedded videos', async () => {
      const { status, body } = await request(app)
        .put(`/users/me/preferences`)
        .send({ download: { includeEmbeddedVideos: 1_234_567.89 } })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['download.includeEmbeddedVideos must be a boolean value']));
    });

    it('should update download include embedded videos', async () => {
      const before = await getMyPreferences({ headers: asBearerAuth(admin.accessToken) });
      expect(before).toMatchObject({ download: { includeEmbeddedVideos: false } });

      const { status, body } = await request(app)
        .put(`/users/me/preferences`)
        .send({ download: { includeEmbeddedVideos: true } })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toMatchObject({ download: { includeEmbeddedVideos: true } });

      const after = await getMyPreferences({ headers: asBearerAuth(admin.accessToken) });
      expect(after).toMatchObject({ download: { includeEmbeddedVideos: true } });
    });
  });

  describe('GET /users/:id', () => {
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
        storageLabel: expect.anything(),
      });
    });
  });

  describe('GET /server/license', () => {
    it('should return the user license', async () => {
      await request(app)
        .put('/users/me/license')
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`)
        .send(userLicense);
      const { status, body } = await request(app)
        .get('/users/me/license')
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({
        ...userLicense,
        activatedAt: expect.any(String),
      });
    });
  });

  describe('PUT /users/me/license', () => {
    it('should set the user license', async () => {
      const { status, body } = await request(app)
        .put(`/users/me/license`)
        .send(userLicense)
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toMatchObject({ ...userLicense, activatedAt: expect.any(String) });
      expect(status).toBe(200);
      expect(body).toEqual({ ...userLicense, activatedAt: expect.any(String) });
      const { body: licenseBody } = await request(app)
        .get('/users/me/license')
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`);
      expect(licenseBody).toEqual({ ...userLicense, activatedAt: expect.any(String) });
    });

    it('should reject license not starting with IMCL-', async () => {
      const { status, body } = await request(app)
        .put('/users/me/license')
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`)
        .send({ licenseKey: 'IMSV-ABCD-ABCD-ABCD-ABCD-ABCD-ABCD-ABCD-ABCD', activationKey: 'activationKey' });
      expect(status).toBe(400);
      expect(body.message).toBe('Invalid license key');
    });

    it('should reject license with invalid activation key', async () => {
      const { status, body } = await request(app)
        .put('/users/me/license')
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`)
        .send({ licenseKey: userLicense.licenseKey, activationKey: `invalid${userLicense.activationKey}` });
      expect(status).toBe(400);
      expect(body.message).toBe('Invalid license key');
    });
  });

  describe('DELETE /users/me/license', () => {
    it('should require authentication', async () => {
      const { status } = await request(app).put(`/users/me/license`);
      expect(status).toEqual(401);
    });

    it('should delete the user license', async () => {
      const { status } = await request(app)
        .delete(`/users/me/license`)
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`);
      expect(status).toBe(200);
    });
  });
});
