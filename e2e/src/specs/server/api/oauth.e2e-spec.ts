import { OAuthClient, OAuthUser, generateLogoutToken } from '@immich/e2e-auth-server';
import {
  LoginResponseDto,
  SystemConfigOAuthDto,
  getConfigDefaults,
  getMyUser,
  getSessions,
  startOAuth,
  updateConfig,
} from '@immich/sdk';
import { createHash, randomBytes } from 'node:crypto';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, baseUrl, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

const authServer = {
  internal: 'http://e2e-auth-server:2286',
  external: 'http://127.0.0.1:2286',
};

const mobileOverrideRedirectUri = 'https://photos.immich.app/oauth/mobile-redirect';

const redirect = async (url: string, cookies?: string[]) => {
  const { headers } = await request(url)
    .get('')
    .set('Cookie', cookies || []);
  return { cookies: (headers['set-cookie'] as unknown as string[]) || [], location: headers.location };
};

// Function to generate a code challenge from the verifier
const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
  const hashed = createHash('sha256').update(codeVerifier).digest();
  return hashed.toString('base64url');
};

const loginWithOAuth = async (sub: OAuthUser | string, redirectUri?: string) => {
  const state = randomBytes(16).toString('base64url');
  const codeVerifier = randomBytes(64).toString('base64url');
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const { url } = await startOAuth({
    oAuthConfigDto: { redirectUri: redirectUri ?? `${baseUrl}/auth/login`, state, codeChallenge },
  });

  // login
  const response1 = await redirect(url.replace(authServer.internal, authServer.external));
  const response2 = await request(authServer.external + response1.location)
    .post('')
    .set('Cookie', response1.cookies)
    .type('form')
    .send({ prompt: 'login', login: sub, password: 'password' });

  // approve
  const response3 = await redirect(response2.header.location, response1.cookies);
  const response4 = await request(authServer.external + response3.location)
    .post('')
    .type('form')
    .set('Cookie', response3.cookies)
    .send({ prompt: 'consent' });

  const response5 = await redirect(response4.header.location, response3.cookies.slice(1));
  const redirectUrl = response5.location;

  expect(redirectUrl).toBeDefined();
  const params = new URL(redirectUrl).searchParams;
  expect(params.get('code')).toBeDefined();
  expect(params.get('state')).toBe(state);

  return { url: redirectUrl, state, codeVerifier };
};

const setupOAuth = async (token: string, dto: Partial<SystemConfigOAuthDto>) => {
  const options = { headers: asBearerAuth(token) };
  const defaults = await getConfigDefaults(options);
  const merged = {
    ...defaults.oauth,
    buttonText: 'Login with Immich',
    issuerUrl: `${authServer.internal}/.well-known/openid-configuration`,
    allowInsecureRequests: true,
    ...dto,
  };
  await updateConfig({ systemConfigDto: { ...defaults, oauth: merged } }, options);
};

describe(`/oauth`, () => {
  let admin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  describe('POST /oauth/authorize', () => {
    beforeAll(async () => {
      await setupOAuth(admin.accessToken, {
        enabled: true,
        clientId: OAuthClient.DEFAULT,
        clientSecret: OAuthClient.DEFAULT,
        buttonText: 'Login with Immich',
        storageLabelClaim: 'immich_username',
      });
    });

    it(`should throw an error if a redirect uri is not provided`, async () => {
      const { status, body } = await request(app).post('/oauth/authorize').send({});
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[redirectUri] Invalid input: expected string, received undefined']));
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

    it('should not include the prompt parameter when not configured', async () => {
      const { status, body } = await request(app)
        .post('/oauth/authorize')
        .send({ redirectUri: 'http://127.0.0.1:2285/auth/login' });
      expect(status).toBe(201);

      const params = new URL(body.url).searchParams;
      expect(params.get('prompt')).toBeNull();
    });

    it('should include the prompt parameter when configured', async () => {
      await setupOAuth(admin.accessToken, {
        enabled: true,
        clientId: OAuthClient.DEFAULT,
        clientSecret: OAuthClient.DEFAULT,
        prompt: 'select_account',
      });

      const { status, body } = await request(app)
        .post('/oauth/authorize')
        .send({ redirectUri: 'http://127.0.0.1:2285/auth/login' });
      expect(status).toBe(201);

      const params = new URL(body.url).searchParams;
      expect(params.get('prompt')).toBe('select_account');
    });
  });

  describe('POST /oauth/callback', () => {
    beforeAll(async () => {
      await setupOAuth(admin.accessToken, {
        enabled: true,
        clientId: OAuthClient.DEFAULT,
        clientSecret: OAuthClient.DEFAULT,
        buttonText: 'Login with Immich',
        storageLabelClaim: 'immich_username',
      });
    });

    it(`should throw an error if a url is not provided`, async () => {
      const { status, body } = await request(app).post('/oauth/callback').send({});
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[url] Invalid input: expected string, received undefined']));
    });

    it(`should throw an error if the url is empty`, async () => {
      const { status, body } = await request(app).post('/oauth/callback').send({ url: '' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[url] Too small: expected string to have >=1 characters']));
    });

    it(`should throw an error if the state is not provided`, async () => {
      const { url } = await loginWithOAuth('oauth-auto-register');
      const { status, body } = await request(app).post('/oauth/callback').send({ url });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('OAuth state is missing'));
    });

    it(`should throw an error if the state mismatches`, async () => {
      const callbackParams = await loginWithOAuth('oauth-auto-register');
      const { state } = await loginWithOAuth('oauth-auto-register');
      const { status } = await request(app)
        .post('/oauth/callback')
        .send({ ...callbackParams, state });
      expect(status).toBeGreaterThanOrEqual(400);
    });

    it(`should throw an error if the codeVerifier is not provided`, async () => {
      const { url, state } = await loginWithOAuth('oauth-auto-register');
      const { status, body } = await request(app).post('/oauth/callback').send({ url, state });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('OAuth code verifier is missing'));
    });

    it(`should throw an error if the codeVerifier doesn't match the challenge`, async () => {
      const callbackParams = await loginWithOAuth('oauth-auto-register');
      const { codeVerifier } = await loginWithOAuth('oauth-auto-register');
      const { status } = await request(app)
        .post('/oauth/callback')
        .send({ ...callbackParams, codeVerifier });
      expect(status).toBeGreaterThanOrEqual(400);
    });

    it('should auto register the user by default', async () => {
      const callbackParams = await loginWithOAuth('oauth-auto-register');
      const { status, body } = await request(app).post('/oauth/callback').send(callbackParams);
      expect(status).toBe(201);
      expect(body).toMatchObject({
        accessToken: expect.any(String),
        isAdmin: false,
        name: 'OAuth User',
        userEmail: 'oauth-auto-register@immich.app',
        userId: expect.any(String),
      });
    });

    it('should allow passing state and codeVerifier via cookies', async () => {
      const { url, state, codeVerifier } = await loginWithOAuth('oauth-auto-register');
      const { status, body } = await request(app)
        .post('/oauth/callback')
        .set('Cookie', [`immich_oauth_state=${state}`, `immich_oauth_code_verifier=${codeVerifier}`])
        .send({ url });
      expect(status).toBe(201);
      expect(body).toMatchObject({
        accessToken: expect.any(String),
        userId: expect.any(String),
        userEmail: 'oauth-auto-register@immich.app',
      });
    });

    it('should handle a user without an email', async () => {
      const callbackParams = await loginWithOAuth(OAuthUser.NO_EMAIL);
      const { status, body } = await request(app).post('/oauth/callback').send(callbackParams);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('OAuth profile does not have an email address'));
    });

    it('should set the quota from a claim', async () => {
      const callbackParams = await loginWithOAuth(OAuthUser.WITH_QUOTA);
      const { status, body } = await request(app).post('/oauth/callback').send(callbackParams);
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
      const callbackParams = await loginWithOAuth(OAuthUser.WITH_USERNAME);
      const { status, body } = await request(app).post('/oauth/callback').send(callbackParams);
      expect(status).toBe(201);
      expect(body).toMatchObject({
        accessToken: expect.any(String),
        userId: expect.any(String),
        userEmail: 'oauth-with-username@immich.app',
      });

      const user = await getMyUser({ headers: asBearerAuth(body.accessToken) });
      expect(user.storageLabel).toBe('user-username');
    });

    it('should set the admin status from a role claim', async () => {
      const callbackParams = await loginWithOAuth(OAuthUser.WITH_ROLE);
      const { status, body } = await request(app).post('/oauth/callback').send(callbackParams);
      expect(status).toBe(201);
      expect(body).toMatchObject({
        accessToken: expect.any(String),
        userId: expect.any(String),
        userEmail: 'oauth-with-role@immich.app',
        isAdmin: true,
      });

      const user = await getMyUser({ headers: asBearerAuth(body.accessToken) });
      expect(user.isAdmin).toBe(true);
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
      const callbackParams = await loginWithOAuth('oauth-RS256-token');
      const { status, body } = await request(app).post('/oauth/callback').send(callbackParams);
      expect(status).toBe(201);
      expect(body).toMatchObject({
        accessToken: expect.any(String),
        isAdmin: false,
        name: 'OAuth User',
        userEmail: 'oauth-rs256-token@immich.app',
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
      const callbackParams = await loginWithOAuth('oauth-signed-profile');
      const { status, body } = await request(app).post('/oauth/callback').send(callbackParams);
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
      const callbackParams = await loginWithOAuth('oauth-signed-bad');
      const { status, body } = await request(app).post('/oauth/callback').send(callbackParams);
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
        const callbackParams = await loginWithOAuth('oauth-no-auto-register');
        const { status, body } = await request(app).post('/oauth/callback').send(callbackParams);
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest('User does not exist and auto registering is disabled.'));
      });

      it('should link to an existing user by email', async () => {
        const { userId } = await utils.userSetup(admin.accessToken, {
          name: 'OAuth User 3',
          email: 'oauth-user3@immich.app',
          password: 'password',
        });
        const callbackParams = await loginWithOAuth('oauth-user3');
        const { status, body } = await request(app).post('/oauth/callback').send(callbackParams);
        expect(status).toBe(201);
        expect(body).toMatchObject({
          userId,
          userEmail: 'oauth-user3@immich.app',
        });
      });
    });
  });

  describe(`POST /oauth/backchannel-logout`, () => {
    it(`should throw an error if the logout_token is not provided`, async () => {
      const { status, body } = await request(app).post('/oauth/backchannel-logout').send({});
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[logout_token] Invalid input: expected string, received undefined']));
    });

    it(`should throw an error if an invalid logout token is provided`, async () => {
      const { status, body } = await request(app)
        .post('/oauth/backchannel-logout')
        .send({ logout_token: 'invalid token' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Error backchannel logout: token validation failed'));
    });

    it(`should logout user if a valid logout token is provided`, async () => {
      await setupOAuth(admin.accessToken, {
        enabled: true,
        clientId: OAuthClient.DEFAULT,
        clientSecret: OAuthClient.DEFAULT,
        autoRegister: true,
        signingAlgorithm: 'RS256',
        buttonText: 'Login with Immich',
      });

      const callbackParams = await loginWithOAuth('backchannel-logout-user');
      const { status: callbackStatus, body: callbackBody } = await request(app)
        .post('/oauth/callback')
        .send(callbackParams);
      expect(callbackStatus).toBe(201);

      await expect(getSessions({ headers: asBearerAuth(callbackBody.accessToken) })).resolves.toHaveLength(1);

      const logoutToken = await generateLogoutToken('http://0.0.0.0:2286', 'backchannel-logout-user');
      const { status, body } = await request(app).post('/oauth/backchannel-logout').send({ logout_token: logoutToken });
      expect(status).toBe(200);
      expect(body).toMatchObject({});

      await expect(getSessions({ headers: asBearerAuth(callbackBody.accessToken) })).rejects.toMatchObject({
        status: 401,
      });
    });
  });

  describe('mobile redirect override', () => {
    beforeAll(async () => {
      await setupOAuth(admin.accessToken, {
        enabled: true,
        clientId: OAuthClient.DEFAULT,
        clientSecret: OAuthClient.DEFAULT,
        buttonText: 'Login with Immich',
        storageLabelClaim: 'immich_username',
        mobileOverrideEnabled: true,
        mobileRedirectUri: mobileOverrideRedirectUri,
      });
    });

    it('should return the mobile redirect uri', async () => {
      const { status, body } = await request(app)
        .post('/oauth/authorize')
        .send({ redirectUri: 'app.immich:///oauth-callback' });
      expect(status).toBe(201);
      expect(body).toEqual({ url: expect.stringContaining(`${authServer.internal}/auth?`) });

      const params = new URL(body.url).searchParams;
      expect(params.get('client_id')).toBe('client-default');
      expect(params.get('response_type')).toBe('code');
      expect(params.get('redirect_uri')).toBe(mobileOverrideRedirectUri);
      expect(params.get('state')).toBeDefined();
    });

    it('should auto register the user by default', async () => {
      const callbackParams = await loginWithOAuth('oauth-mobile-override', 'app.immich:///oauth-callback');
      expect(callbackParams.url).toEqual(expect.stringContaining(mobileOverrideRedirectUri));

      // simulate redirecting back to mobile app
      const url = callbackParams.url.replace(mobileOverrideRedirectUri, 'app.immich:///oauth-callback');

      const { status, body } = await request(app)
        .post('/oauth/callback')
        .send({ ...callbackParams, url });
      expect(status).toBe(201);
      expect(body).toMatchObject({
        accessToken: expect.any(String),
        isAdmin: false,
        name: 'OAuth User',
        userEmail: 'oauth-mobile-override@immich.app',
        userId: expect.any(String),
      });
    });
  });

  describe('idTokenClaims', () => {
    it('should use claims from the ID token if IDP includes them', async () => {
      await setupOAuth(admin.accessToken, {
        enabled: true,
        clientId: OAuthClient.DEFAULT,
        clientSecret: OAuthClient.DEFAULT,
      });
      const callbackParams = await loginWithOAuth(OAuthUser.ID_TOKEN_CLAIMS);
      const { status, body } = await request(app).post('/oauth/callback').send(callbackParams);
      expect(status).toBe(201);
      expect(body).toMatchObject({
        accessToken: expect.any(String),
        name: 'ID Token User',
        userEmail: 'oauth-id-token-claims@immich.app',
        userId: expect.any(String),
      });
    });
  });

  describe('allowInsecureRequests: false', () => {
    beforeAll(async () => {
      await setupOAuth(admin.accessToken, {
        enabled: true,
        clientId: OAuthClient.DEFAULT,
        clientSecret: OAuthClient.DEFAULT,
        allowInsecureRequests: false,
      });
    });

    it('should reject OAuth discovery over HTTP', async () => {
      const { status, body } = await request(app)
        .post('/oauth/authorize')
        .send({ redirectUri: 'http://127.0.0.1:2285/auth/login' });
      expect(status).toBe(500);
      expect(body).toMatchObject({ statusCode: 500 });
    });
  });
});
