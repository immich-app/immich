import { AuthController } from 'src/controllers/auth.controller';
import { LoginResponseDto } from 'src/dtos/auth.dto';
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
    service.resetAllMocks();
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

    it('should accept an email with a local domain', async () => {
      const { status } = await request(ctx.getHttpServer())
        .post('/auth/admin-sign-up')
        .send({ name: 'admin', password: 'password', email: 'admin@local' });
      expect(status).toEqual(201);
    });
  });

  describe('POST /auth/login', () => {
    it(`should require an email and password`, async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/auth/login').send({ name: 'admin' });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.badRequest([
          'email should not be empty',
          'email must be an email',
          'password should not be empty',
          'password must be a string',
        ]),
      );
    });

    it(`should not allow null email`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/auth/login')
        .send({ name: 'admin', email: null, password: 'password' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['email should not be empty', 'email must be an email']));
    });

    it(`should not allow null password`, async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/auth/login')
        .send({ name: 'admin', email: 'admin@immich.cloud', password: null });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['password should not be empty', 'password must be a string']));
    });

    it('should reject an invalid email', async () => {
      service.login.mockResolvedValue({ accessToken: 'access-token' } as LoginResponseDto);

      const { status, body } = await request(ctx.getHttpServer())
        .post('/auth/login')
        .send({ name: 'admin', email: [], password: 'password' });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['email must be an email']));
    });

    it('should transform the email to all lowercase', async () => {
      service.login.mockResolvedValue({ accessToken: 'access-token' } as LoginResponseDto);

      const { status } = await request(ctx.getHttpServer())
        .post('/auth/login')
        .send({ name: 'admin', email: 'aDmIn@iMmIcH.ApP', password: 'password' });

      expect(status).toBe(201);
      expect(service.login).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'admin@immich.app' }),
        expect.anything(),
      );
    });

    it('should accept an email with a local domain', async () => {
      service.login.mockResolvedValue({ accessToken: 'access-token' } as LoginResponseDto);

      const { status } = await request(ctx.getHttpServer())
        .post('/auth/login')
        .send({ name: 'admin', email: 'admin@local', password: 'password' });

      expect(status).toEqual(201);
      expect(service.login).toHaveBeenCalledWith(expect.objectContaining({ email: 'admin@local' }), expect.anything());
    });
  });

  describe('POST /auth/change-password', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer())
        .post('/auth/change-password')
        .send({ password: 'password', newPassword: 'Password1234' });
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('POST /auth/create-pincode', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/auth/create-pincode').send({ pincode: '123456' });
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('POST /auth/change-pincode', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/auth/change-pincode').send({ pincode: '123456', newPincode: '654321' });
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('POST /auth/reset-pincode', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/auth/reset-pincode').send({ userId: '123456' });
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a userId', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/auth/reset-pincode').send({ name: 'admin' });

      expect(status).toEqual(400);
      expect(body).toEqual(errorDto.badRequest(['userId should not be empty', 'userId must be a string']));
    });
  });

  describe('GET /auth/status', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/auth/status');
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });
});
