import request from 'supertest';
import { OAuthController } from 'src/controllers/oauth.controller.js';
import { AuthService } from 'src/services/auth.service.js';
import { factory } from 'test/small.factory.js';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils.js';

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

    it('should set the state and code verifier cookies when the server generates them', async () => {
      service.authorize.mockResolvedValue({ url: 'http://idp/auth', state: 'server-state', codeVerifier: 'verifier' });

      const { status, headers } = await request(ctx.getHttpServer())
        .post('/oauth/authorize')
        .send({ redirectUri: 'http://immich/auth/login' });

      expect(status).toBe(201);
      const cookies = (headers['set-cookie'] as unknown as string[]) ?? [];
      expect(cookies).toEqual([
        expect.stringContaining('immich_oauth_state=server-state'),
        expect.stringContaining('immich_oauth_code_verifier=verifier'),
      ]);
    });

    it('should not set cookies for client supplied state and code challenge', async () => {
      service.authorize.mockResolvedValue({ url: 'http://idp/auth', state: 'client-state', codeVerifier: null });

      const { status, headers } = await request(ctx.getHttpServer())
        .post('/oauth/authorize')
        .send({ redirectUri: 'http://immich/auth/login', state: 'client-state', codeChallenge: 'challenge' });

      expect(status).toBe(201);
      expect(headers['set-cookie']).toBeUndefined();
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
