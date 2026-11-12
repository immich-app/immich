import { Route } from '#lib/route.ts';
import type { MockData } from '#test/common/data.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import type { LoginResponseDto } from '@immich/sdk';
import type { Page } from '@playwright/test';
import { generateKeyPairSync } from 'node:crypto';

const providerUrl = 'https://oauth.example.com/authorize?state=immich';
const credentialId = Buffer.from('immich-passkey');
const challenge = 'c2VydmVyLWNoYWxsZW5nZQ';

const routeProvider = (page: Page) =>
  page.route('https://oauth.example.com/**', (route) =>
    route.fulfill({ body: '<h1>OAuth provider</h1>', contentType: 'text/html' }),
  );

const loginResponse = ({ user }: MockData): LoginResponseDto => ({
  accessToken: 'access-token',
  isAdmin: user.isAdmin,
  isOnboarded: true,
  name: user.name,
  profileImagePath: user.profileImagePath,
  shouldChangePassword: false,
  userEmail: user.email,
  userId: user.id,
});

const addPasskey = async (page: Page, rpId: string) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
    },
  });
  const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  await cdp.send('WebAuthn.addCredential', {
    authenticatorId,
    credential: {
      credentialId: credentialId.toString('base64'),
      isResidentCredential: true,
      rpId,
      privateKey: privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64'),
      userHandle: Buffer.from('immich-user').toString('base64'),
      signCount: 0,
    },
  });
  return () => cdp.detach();
};

const decodeClientData = (clientDataJSON: string) =>
  JSON.parse(Buffer.from(clientDataJSON, 'base64url').toString()) as unknown;

test.describe('login', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test.afterEach(async ({ page }) => {
    await page.unrouteAll();
  });

  test('oauth button redirects to the provider', async ({ page, data, api, app, baseURL }) => {
    data.publicConfig.oauth.enabled = true;
    api.on({ startOAuth: () => ({ status: 201, json: { url: providerUrl } }) });
    await routeProvider(page);
    await page.goto(Route.login());

    await app.login.oauthButton.click();

    await expect(page).toHaveURL(providerUrl);
    await expect(page.getByRole('heading', { name: 'OAuth provider' })).toBeVisible();
    expect(api.startOAuth).toHaveBeenCalledWith({ body: { redirectUri: `${baseURL}${Route.login()}` } });
  });

  test('oauth auto launch redirects to the provider', async ({ page, data, api, baseURL }) => {
    data.publicConfig.oauth.enabled = true;
    data.publicConfig.oauth.autoLaunch = true;
    api.on({ startOAuth: () => ({ status: 201, json: { url: providerUrl } }) });
    await routeProvider(page);

    await page.goto(Route.login());

    await expect(page).toHaveURL(providerUrl);
    expect(api.startOAuth).toHaveBeenCalledWith({ body: { redirectUri: `${baseURL}${Route.login()}` } });
  });

  for (const query of ['autoLaunch=0', 'password=1']) {
    test(`oauth auto launch stays on the login page with ${query}`, async ({ page, data, api, app }) => {
      data.publicConfig.oauth.enabled = true;
      data.publicConfig.oauth.autoLaunch = true;

      await page.goto(`${Route.login()}?${query}`);

      await expect(app.login.oauthButton).toBeEnabled();
      await expect(page).toHaveURL(`${Route.login()}?${query}`);
      expect(api.startOAuth).not.toHaveBeenCalled();
    });
  }

  test('passkey login signs in and opens the timeline', async ({ page, data, api, app, baseURL }) => {
    const origin = baseURL!.replace('127.0.0.1', 'localhost');
    const removePasskey = await addPasskey(page, 'localhost');
    api.on({
      startAuthentication: () => ({ json: { challenge, rpId: 'localhost', userVerification: 'required' } }),
      finishAuthentication: () => ({
        status: 201,
        json: loginResponse(data),
        headers: { 'Set-Cookie': 'immich_is_authenticated=true; Path=/' },
      }),
    });
    await page.goto(`${origin}${Route.login()}`);

    await app.login.passkeyButton.click();

    await expect(page).toHaveURL(`${origin}${Route.photos()}`);
    await removePasskey();
    expect(api.startAuthentication).toHaveBeenCalled();
    expect(api.finishAuthentication).toHaveBeenCalledWith({
      body: { response: expect.objectContaining({ id: credentialId.toString('base64url'), type: 'public-key' }) },
    });
    const [{ body }] = api.finishAuthentication.calls;
    expect(decodeClientData(body.response.response.clientDataJSON)).toMatchObject({
      type: 'webauthn.get',
      challenge,
      origin,
    });
  });
});
