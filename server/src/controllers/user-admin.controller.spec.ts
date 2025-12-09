import { UserAdminController } from 'src/controllers/user-admin.controller';
import { UserAdminCreateDto } from 'src/dtos/user.dto';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { UserAdminService } from 'src/services/user-admin.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { factory } from 'test/small.factory';
import { automock, ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(UserAdminController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(UserAdminService);

  beforeAll(async () => {
    ctx = await controllerSetup(UserAdminController, [
      { provide: LoggingRepository, useValue: automock(LoggingRepository, { strict: false }) },
      { provide: UserAdminService, useValue: service },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('GET /admin/users', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/admin/users');
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('POST /admin/users', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/admin/users');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it(`should not allow decimal quota`, async () => {
      const dto: UserAdminCreateDto = {
        email: 'user@immich.app',
        password: 'test',
        name: 'Test User',
        quotaSizeInBytes: 1.2,
      };

      const { status, body } = await request(ctx.getHttpServer())
        .post(`/admin/users`)
        .set('Authorization', `Bearer token`)
        .send(dto);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(expect.arrayContaining(['quotaSizeInBytes must be an integer number'])));
    });
  });

  describe('GET /admin/users/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get(`/admin/users/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('PUT /admin/users/:id', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).put(`/admin/users/${factory.uuid()}`);
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it(`should not allow decimal quota`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(`/admin/users/${factory.uuid()}`)
        .set('Authorization', `Bearer token`)
        .send({ quotaSizeInBytes: 1.2 });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(expect.arrayContaining(['quotaSizeInBytes must be an integer number'])));
    });
  });
});
