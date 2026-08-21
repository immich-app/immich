import { LoginResponseDto, getMyUser, login } from '@immich/sdk';
import { createUserDto } from 'src/fixtures';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/users', () => {
  let admin: LoginResponseDto;
  let nonAdmin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup({ onboarding: false });
    nonAdmin = await utils.userSetup(admin.accessToken, createUserDto.user2);
  });

  describe('PUT /users/me', () => {
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
  });
});
