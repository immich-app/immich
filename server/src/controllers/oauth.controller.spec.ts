import { OAuthController } from 'src/controllers/oauth.controller';
import { AuthService } from 'src/services/auth.service';
import request from 'supertest';
import { factory } from 'test/small.factory';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(OAuthController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(AuthService);

  beforeAll(async () => {
    ctx = await controllerSetup(OAuthController, [{ provide: AuthService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('POST /oauth/authorize', () => {
    it('should require a redirect uri', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/oauth/authorize').send({});

      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.validationError([
          { path: ['redirectUri'], message: 'Invalid input: expected string, received undefined' },
        ]),
      );
      expect(service.authorize).not.toHaveBeenCalled();
    });
  });

  describe('POST /oauth/callback', () => {
    it('should require a url', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/oauth/callback').send({});

      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.validationError([
          { path: ['url'], message: 'Invalid input: expected string, received undefined' },
        ]),
      );
    });

    it('should not allow an empty url', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/oauth/callback').send({ url: '' });

      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.validationError([
          { path: ['url'], message: 'Too small: expected string to have >=1 characters' },
        ]),
      );
    });
  });

  describe('POST /oauth/backchannel-logout', () => {
    it('should require a logout token', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/oauth/backchannel-logout').send({});

      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.validationError([
          { path: ['logout_token'], message: 'Invalid input: expected string, received undefined' },
        ]),
      );
    });
  });
});
