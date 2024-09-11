import {
  LoginResponseDto,
  SystemConfigOAuthDto,
  getConfigDefaults,
  getMyUser,
  startOAuth,
  updateConfig,
} from '@immich/sdk';
import { errorDto } from 'src/responses';
import { OAuthClient, OAuthUser } from 'src/setup/auth-server';
import { app, asBearerAuth, baseUrl, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

const authServer = {
  internal: 'http://auth-server:3000',
  external: 'http://127.0.0.1:3000',
};

const redirect = async (url: string, cookies?: string[]) => {
  const { headers } = await request(url)
    .get('/')
    .set('Cookie', cookies || []);
  return { cookies: (headers['set-cookie'] as unknown as string[]) || [], location: headers.location };
};

const loginWithOAuth = async (sub: OAuthUser | string) => {
  const { url } = await startOAuth({ oAuthConfigDto: { redirectUri: `${baseUrl}/auth/login` } });

  // login
  const response1 = await redirect(url.replace(authServer.internal, authServer.external));
  const response2 = await request(authServer.external + response1.location)
    .post('/')
    .set('Cookie', response1.cookies)
    .type('form')
    .send({ prompt: 'login', login: sub, password: 'password' });

  // approve
  const response3 = await redirect(response2.header.location, response1.cookies);
  const response4 = await request(authServer.external + response3.location)
    .post('/')
    .type('form')
    .set('Cookie', response3.cookies)
    .send({ prompt: 'consent' });

  const response5 = await redirect(response4.header.location, response3.cookies.slice(1));
  const redirectUrl = response5.location;

  expect(redirectUrl).toBeDefined();
  const params = new URL(redirectUrl).searchParams;
  expect(params.get('code')).toBeDefined();
  expect(params.get('state')).toBeDefined();

  return redirectUrl;
};

const setupOAuth = async (token: string, dto: Partial<SystemConfigOAuthDto>) => {
  const options = { headers: asBearerAuth(token) };
  const defaults = await getConfigDefaults(options);
  const merged = {
    ...defaults.oauth,
    buttonText: 'Login with Immich',
    issuerUrl: `${authServer.internal}/.well-known/openid-configuration`,
    ...dto,
  };
  await updateConfig({ systemConfigDto: { ...defaults, oauth: merged } }, options);
};

describe(`/oauth`, () => {
  let admin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();

    await setupOAuth(admin.accessToken, {
      enabled: true,
      clientId: OAuthClient.DEFAULT,
      clientSecret: OAuthClient.DEFAULT,
      buttonText: 'Login with Immich',
      storageLabelClaim: 'immich_username',
    });
  });

  describe('POST /oauth/authorize', () => {
    it(`should throw an error if a redirect uri is not provided`, async () => {
      const { status, body } = await request(app).post('/oauth/authorize').send({});
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['redirectUri must be a string', 'redirectUri should not be empty']));
    });

    it('should return a redirect uri', async () => {
      const { status, body } = await request(app)
        .post('/oauth/authorize')
        .send({ redirectUri: 'http://127.0.0.1:2285/auth/login' });
      expect(status).toBe(201);
      expect(body).toEqual({ url: expect.stringContaining(`${authServer.internal}/auth?`) });

      const params = new URL(body.url).searchParams;
      expect(params.get('client_id')).toBe('client-default');
      expect(params.get('response_type')).toBe('code');
      expect(params.get('redirect_uri')).toBe('http://127.0.0.1:2285/auth/login');
      expect(params.get('state')).toBeDefined();
    });
  });

  describe('POST /oauth/callback', () => {
    it(`should throw an error if a url is not provided`, async () => {
      const { status, body } = await request(app).post('/oauth/callback').send({});
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['url must be a string', 'url should not be empty']));
    });

    it(`should throw an error if the url is empty`, async () => {
      const { status, body } = await request(app).post('/oauth/callback').send({ url: '' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['url should not be empty']));
    });

    it('should auto register the user by default', async () => {
      const url = await loginWithOAuth('oauth-auto-register');
      const { status, body } = await request(app).post('/oauth/callback').send({ url });
      expect(status).toBe(201);
      expect(body).toMatchObject({
        accessToken: expect.any(String),
        isAdmin: false,
        name: 'OAuth User',
        userEmail: 'oauth-auto-register@immich.app',
        userId: expect.any(String),
      });
    });

    it('should handle a user without an email', async () => {
      const url = await loginWithOAuth(OAuthUser.NO_EMAIL);
      const { status, body } = await request(app).post('/oauth/callback').send({ url });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('OAuth profile does not have an email address'));
    });

    it('should set the quota from a claim', async () => {
      const url = await loginWithOAuth(OAuthUser.WITH_QUOTA);
      const { status, body } = await request(app).post('/oauth/callback').send({ url });
      expect(status).toBe(201);
      expect(body).toMatchObject({
        accessToken: expect.any(String),
        userId: expect.any(String),
        userEmail: 'oauth-with-quota@immich.app',
      });

      const user = await getMyUser({ headers: asBearerAuth(body.accessToken) });
      expect(user.quotaSizeInBytes).toBe(25 * 2 ** 30); // 25 GiB;
    });

    it('should set the storage label from a claim', async () => {
      const url = await loginWithOAuth(OAuthUser.WITH_USERNAME);
      const { status, body } = await request(app).post('/oauth/callback').send({ url });
      expect(status).toBe(201);
      expect(body).toMatchObject({
        accessToken: expect.any(String),
        userId: expect.any(String),
        userEmail: 'oauth-with-username@immich.app',
      });

      const user = await getMyUser({ headers: asBearerAuth(body.accessToken) });
      expect(user.storageLabel).toBe('user-username');
    });

    it('should work with RS256 signed tokens', async () => {
      await setupOAuth(admin.accessToken, {
        enabled: true,
        clientId: OAuthClient.RS256_TOKENS,
        clientSecret: OAuthClient.RS256_TOKENS,
        autoRegister: true,
        buttonText: 'Login with Immich',
        signingAlgorithm: 'RS256',
      });
      const url = await loginWithOAuth('oauth-RS256-token');
      const { status, body } = await request(app).post('/oauth/callback').send({ url });
      expect(status).toBe(201);
      expect(body).toMatchObject({
        accessToken: expect.any(String),
        isAdmin: false,
        name: 'OAuth User',
        userEmail: 'oauth-RS256-token@immich.app',
        userId: expect.any(String),
      });
    });

    it('should work with RS256 signed user profiles', async () => {
      await setupOAuth(admin.accessToken, {
        enabled: true,
        clientId: OAuthClient.RS256_PROFILE,
        clientSecret: OAuthClient.RS256_PROFILE,
        buttonText: 'Login with Immich',
        profileSigningAlgorithm: 'RS256',
      });
      const url = await loginWithOAuth('oauth-signed-profile');
      const { status, body } = await request(app).post('/oauth/callback').send({ url });
      expect(status).toBe(201);
      expect(body).toMatchObject({
        userId: expect.any(String),
        userEmail: 'oauth-signed-profile@immich.app',
      });
    });

    it('should throw an error for an invalid token algorithm', async () => {
      await setupOAuth(admin.accessToken, {
        enabled: true,
        clientId: OAuthClient.DEFAULT,
        clientSecret: OAuthClient.DEFAULT,
        buttonText: 'Login with Immich',
        signingAlgorithm: 'something-that-does-not-work',
      });
      const url = await loginWithOAuth('oauth-signed-bad');
      const { status, body } = await request(app).post('/oauth/callback').send({ url });
      expect(status).toBe(500);
      expect(body).toMatchObject({
        error: 'Internal Server Error',
        message: 'Failed to finish oauth',
        statusCode: 500,
      });
    });

    describe('autoRegister: false', () => {
      beforeAll(async () => {
        await setupOAuth(admin.accessToken, {
          enabled: true,
          clientId: OAuthClient.DEFAULT,
          clientSecret: OAuthClient.DEFAULT,
          autoRegister: false,
          buttonText: 'Login with Immich',
        });
      });

      it('should not auto register the user', async () => {
        const url = await loginWithOAuth('oauth-no-auto-register');
        const { status, body } = await request(app).post('/oauth/callback').send({ url });
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest('User does not exist and auto registering is disabled.'));
      });

      it('should link to an existing user by email', async () => {
        const { userId } = await utils.userSetup(admin.accessToken, {
          name: 'OAuth User 3',
          email: 'oauth-user3@immich.app',
          password: 'password',
        });
        const url = await loginWithOAuth('oauth-user3');
        const { status, body } = await request(app).post('/oauth/callback').send({ url });
        expect(status).toBe(201);
        expect(body).toMatchObject({
          userId,
          userEmail: 'oauth-user3@immich.app',
        });
      });
    });
  });
});
