import { AuthController } from 'src/controllers/auth.controller';
import { AuthService } from 'src/services/auth.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(AuthController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(AuthService);

  beforeAll(async () => {
    ctx = await controllerSetup(AuthController, [{ provide: AuthService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    ctx.reset();
  });

  describe('POST /auth/admin-sign-up', () => {
    const name = 'admin';
    const email = 'admin@immich.cloud';
    const password = 'password';

    it('should require an email address', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/auth/admin-sign-up').send({ name, password });
      expect(status).toEqual(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    it('should require a password', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/auth/admin-sign-up').send({ name, email });
      expect(status).toEqual(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    it('should require a name', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/auth/admin-sign-up').send({ email, password });
      expect(status).toEqual(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    it('should require a valid email', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/auth/admin-sign-up')
        .send({ name, email: 'immich', password });
      expect(status).toEqual(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    it('should transform email to lower case', async () => {
      service.adminSignUp.mockReset();
      const { status } = await request(ctx.getHttpServer())
        .post('/auth/admin-sign-up')
        .send({ name: 'admin', password: 'password', email: 'aDmIn@IMMICH.cloud' });
      expect(status).toEqual(201);
      expect(service.adminSignUp).toHaveBeenCalledWith(expect.objectContaining({ email: 'admin@immich.cloud' }));
    });
  });
});
