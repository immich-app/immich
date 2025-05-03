import { UserController } from 'src/controllers/user.controller';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { UserService } from 'src/services/user.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { factory } from 'test/small.factory';
import { automock, ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(UserController.name, () => {
  let ctx: ControllerContext;

  beforeAll(async () => {
    ctx = await controllerSetup(UserController, [
      { provide: LoggingRepository, useValue: automock(LoggingRepository, { strict: false }) },
      { provide: UserService, useValue: mockBaseService(UserService) },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    ctx.reset();
  });

  describe('GET /users', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/users');
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('GET /users/me', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/users/me');
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('PUT /users/me', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).put('/users/me');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    for (const key of ['email', 'name']) {
      it(`should not allow null ${key}`, async () => {
        const dto = { [key]: null };
        const { status, body } = await request(ctx.getHttpServer())
          .put(`/users/me`)
          .set('Authorization', `Bearer token`)
          .send(dto);
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest());
      });
    }
  });

  describe('GET /users/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get(`/users/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('PUT /users/me/license', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).put('/users/me/license');
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('DELETE /users/me/license', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).delete('/users/me/license');
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });
});
