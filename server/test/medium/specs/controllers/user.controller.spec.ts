import { UserController } from 'src/controllers/user.controller';
import { AuthService } from 'src/services/auth.service';
import { UserService } from 'src/services/user.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { createControllerTestApp, TestControllerApp } from 'test/medium/utils';
import { factory } from 'test/small.factory';

describe(UserController.name, () => {
  let realApp: TestControllerApp;
  let mockApp: TestControllerApp;

  beforeAll(async () => {
    realApp = await createControllerTestApp({ authType: 'real' });
    mockApp = await createControllerTestApp({ authType: 'mock' });
  });

  describe('GET /users', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(realApp.getHttpServer()).get('/users');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should call the service with an auth dto', async () => {
      const user = factory.user();
      const authService = mockApp.getMockedService(AuthService);
      const auth = factory.auth({ user });
      authService.authenticate.mockResolvedValue(auth);

      const userService = mockApp.getMockedService(UserService);
      const { status } = await request(mockApp.getHttpServer()).get('/users').set('Authorization', `Bearer token`);

      expect(status).toBe(200);
      expect(userService.search).toHaveBeenCalledWith(auth);
    });
  });

  describe('GET /users/me', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(realApp.getHttpServer()).get(`/users/me`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });
  });

  describe('PUT /users/me', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(realApp.getHttpServer()).put(`/users/me`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    for (const key of ['email', 'name']) {
      it(`should not allow null ${key}`, async () => {
        const dto = { [key]: null };
        const { status, body } = await request(mockApp.getHttpServer())
          .put(`/users/me`)
          .set('Authorization', `Bearer token`)
          .send(dto);
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest());
      });
    }
  });

  describe('GET /users/:id', () => {
    it('should require authentication', async () => {
      const { status } = await request(realApp.getHttpServer()).get(`/users/${factory.uuid()}`);
      expect(status).toEqual(401);
    });
  });

  describe('GET /server/license', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(realApp.getHttpServer()).get('/users/me/license');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });
  });

  describe('PUT /users/me/license', () => {
    it('should require authentication', async () => {
      const { status } = await request(realApp.getHttpServer()).put(`/users/me/license`);
      expect(status).toEqual(401);
    });
  });

  describe('DELETE /users/me/license', () => {
    it('should require authentication', async () => {
      const { status } = await request(realApp.getHttpServer()).put(`/users/me/license`);
      expect(status).toEqual(401);
    });
  });

  afterAll(async () => {
    await realApp.close();
    await mockApp.close();
  });
});
