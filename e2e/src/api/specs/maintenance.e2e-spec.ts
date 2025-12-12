import { LoginResponseDto } from '@immich/sdk';
import { createUserDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/admin/maintenance', () => {
  let cookie: string | undefined;
  let admin: LoginResponseDto;
  let nonAdmin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    nonAdmin = await utils.userSetup(admin.accessToken, createUserDto.user1);
  });

  // => outside of maintenance mode

  describe('GET ~/server/config', async () => {
    it('should indicate we are out of maintenance mode', async () => {
      const { status, body } = await request(app).get('/server/config');
      expect(status).toBe(200);
      expect(body.maintenanceMode).toBeFalsy();
    });
  });

  describe('POST /login', async () => {
    it('should not work out of maintenance mode', async () => {
      const { status, body } = await request(app).post('/admin/maintenance/login').send({ token: 'token' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Not in maintenance mode'));
    });
  });

  // => enter maintenance mode

  describe.sequential('POST /', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/admin/maintenance').send({
        action: 'end',
      });
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should only work for admins', async () => {
      const { status, body } = await request(app)
        .post('/admin/maintenance')
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`)
        .send({ action: 'end' });
      expect(status).toBe(403);
      expect(body).toEqual(errorDto.forbidden);
    });

    it('should be a no-op if try to exit maintenance mode', async () => {
      const { status } = await request(app)
        .post('/admin/maintenance')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ action: 'end' });
      expect(status).toBe(201);
    });

    it('should enter maintenance mode', async () => {
      const { status, headers } = await request(app)
        .post('/admin/maintenance')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          action: 'start',
        });
      expect(status).toBe(201);

      cookie = headers['set-cookie'][0].split(';')[0];
      expect(cookie).toEqual(
        expect.stringMatching(/^immich_maintenance_token=[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*$/),
      );

      await expect
        .poll(
          async () => {
            const { body } = await request(app).get('/server/config');
            return body.maintenanceMode;
          },
          {
            interval: 5e2,
            timeout: 1e4,
          },
        )
        .toBeTruthy();
    });
  });

  // => in maintenance mode

  describe.sequential('in maintenance mode', () => {
    describe('GET ~/server/config', async () => {
      it('should indicate we are in maintenance mode', async () => {
        const { status, body } = await request(app).get('/server/config');
        expect(status).toBe(200);
        expect(body.maintenanceMode).toBeTruthy();
      });
    });

    describe('POST /login', async () => {
      it('should fail without cookie or token in body', async () => {
        const { status, body } = await request(app).post('/admin/maintenance/login').send({});
        expect(status).toBe(401);
        expect(body).toEqual(errorDto.unauthorizedWithMessage('Missing JWT Token'));
      });

      it('should succeed with cookie', async () => {
        const { status, body } = await request(app).post('/admin/maintenance/login').set('cookie', cookie!).send({});
        expect(status).toBe(201);
        expect(body).toEqual(
          expect.objectContaining({
            username: 'Immich Admin',
          }),
        );
      });

      it('should succeed with token', async () => {
        const { status, body } = await request(app)
          .post('/admin/maintenance/login')
          .send({
            token: cookie!.split('=')[1].trim(),
          });
        expect(status).toBe(201);
        expect(body).toEqual(
          expect.objectContaining({
            username: 'Immich Admin',
          }),
        );
      });
    });

    describe('POST /', async () => {
      it('should be a no-op if try to enter maintenance mode', async () => {
        const { status } = await request(app)
          .post('/admin/maintenance')
          .set('cookie', cookie!)
          .send({ action: 'start' });
        expect(status).toBe(201);
      });
    });
  });

  // => exit maintenance mode

  describe.sequential('POST /', () => {
    it('should exit maintenance mode', async () => {
      const { status } = await request(app).post('/admin/maintenance').set('cookie', cookie!).send({
        action: 'end',
      });

      expect(status).toBe(201);

      await expect
        .poll(
          async () => {
            const { body } = await request(app).get('/server/config');
            return body.maintenanceMode;
          },
          {
            interval: 5e2,
            timeout: 1e4,
          },
        )
        .toBeFalsy();
    });
  });
});
