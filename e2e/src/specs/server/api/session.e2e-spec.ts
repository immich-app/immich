import { LoginResponseDto, getSessions, login, signUpAdmin } from '@immich/sdk';
import { loginDto, signupDto, uuidDto } from 'src/fixtures';
import { deviceDto, errorDto } from 'src/responses';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

describe('/sessions', () => {
  let admin: LoginResponseDto;

  beforeEach(async () => {
    await utils.resetDatabase();
    await signUpAdmin({ signUpDto: signupDto.admin });
    admin = await login({ loginCredentialDto: loginDto.admin });
  });

  describe('GET /sessions', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/sessions');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should get a list of authorized devices', async () => {
      const { status, body } = await request(app).get('/sessions').set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual([deviceDto.current]);
    });
  });

  describe('DELETE /sessions', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).delete(`/sessions`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should logout all devices (except the current one)', async () => {
      for (let i = 0; i < 5; i++) {
        await login({ loginCredentialDto: loginDto.admin });
      }

      await expect(getSessions({ headers: asBearerAuth(admin.accessToken) })).resolves.toHaveLength(6);

      const { status } = await request(app).delete(`/sessions`).set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(204);

      await expect(getSessions({ headers: asBearerAuth(admin.accessToken) })).resolves.toHaveLength(1);
    });

    it('should throw an error for a non-existent device id', async () => {
      const { status, body } = await request(app)
        .delete(`/sessions/${uuidDto.notFound}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Not found or no authDevice.delete access'));
    });

    it('should logout a device', async () => {
      const [device] = await getSessions({
        headers: asBearerAuth(admin.accessToken),
      });
      const { status } = await request(app)
        .delete(`/sessions/${device.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(204);

      const response = await request(app)
        .post('/auth/validateToken')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(response.body).toEqual(errorDto.invalidToken);
      expect(response.status).toBe(401);
    });
  });
});
