import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { queryClient } from '#lib/queries/client.ts';
import { getPublicConfigQuery } from '#lib/queries/config-public.query.ts';
import { getServerConfigQuery } from '#lib/queries/server-info.query.ts';
import { Route } from '#lib/route.ts';
import type { App } from '#test/unit/app.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect } from 'vitest';
import Page from './+page.svelte';
import { load } from './+page.ts';

const credentials = { email: 'admin@immich.cloud', password: 'password' };

const submitLogin = async (app: App) => {
  await app.auth.input('email').fill(credentials.email);
  await app.auth.input('password').fill(credentials.password);
  await app.auth.loginButton.click();
};

test('logs in and continues to the requested page', async ({ router, render, settle, api, app }) => {
  await router.goto(Route.login({ continue: '/albums' }));
  await render(Page, load);

  await submitLogin(app);
  await settle();

  expect(api.login).toHaveBeenCalledWith({ body: credentials });
  expect(router.url.pathname).toBe(Route.albums());
});

test('logs in and continues to the photos page by default', async ({ router, render, settle, api, app }) => {
  await router.goto(Route.login());
  await render(Page, load);

  await submitLogin(app);
  await settle();

  expect(api.login).toHaveBeenCalledWith({ body: credentials });
  expect(router.url.pathname).toBe(Route.photos());
});

test('shows an error for invalid credentials', async ({ router, render, settle, api, app }) => {
  api.on({ login: () => ({ status: 401, json: { message: 'Incorrect email or password', statusCode: 401 } }) });
  await router.goto(Route.login());
  await render(Page, load);

  await submitLogin(app);
  await settle();

  expect(api.login).toHaveBeenCalledWith({ body: credentials });
  await expect.element(app.auth.text('Incorrect email or password')).toBeVisible();
  expect(router.url.pathname).toBe(Route.login());
});

test('sends a first login to change password', async ({ data, router, render, settle, api, app }) => {
  Object.assign(data.user, { isAdmin: false, shouldChangePassword: true });
  await router.goto(Route.login());
  await render(Page, load);

  await submitLogin(app);
  await settle();

  expect(api.login).toHaveBeenCalledWith({ body: credentials });
  expect(router.url.pathname).toBe(Route.changePassword());
});

test('sends a user who is not onboarded to onboarding', async ({ data, router, render, settle, api, app }) => {
  data.isOnboarded = false;
  await router.goto(Route.login());
  await render(Page, load);

  await submitLogin(app);
  await settle();

  expect(api.login).toHaveBeenCalledWith({ body: credentials });
  expect(router.url.pathname).toBe(Route.onboarding());
});

test('sends an admin to server onboarding', async ({ data, router, render, settle, api, app }) => {
  data.serverConfig.isOnboarded = false;
  await queryClient.refetchQueries({ queryKey: getServerConfigQuery().queryKey, exact: true });
  await router.goto(Route.login());
  await render(Page, load);

  await submitLogin(app);
  await settle();

  expect(api.login).toHaveBeenCalledWith({ body: credentials });
  expect(router.url.pathname).toBe(Route.onboarding());
});

test('redirects to registration when the server is not initialized', async ({ data, router, render }) => {
  data.serverConfig.isInitialized = false;
  await queryClient.refetchQueries({ queryKey: getServerConfigQuery().queryKey, exact: true });
  await router.goto(Route.login());

  await expect(render(Page, load)).rejects.toThrow(`redirected to ${Route.register()}`);
});

test('redirects an authenticated user to the continue url', async ({ router, render }) => {
  await authManager.load();
  await router.goto(Route.login({ continue: '/albums' }));

  await expect(render(Page, load)).rejects.toThrow(`redirected to ${location.origin}${Route.albums()}`);
});

test('finishes an OAuth login from the callback url', async ({ data, router, render, settle, api }) => {
  data.publicConfig.oauth.enabled = true;
  await queryClient.refetchQueries({ queryKey: getPublicConfigQuery().queryKey, exact: true });
  const path = location.pathname;
  history.replaceState({}, '', '?code=oauth-code&state=oauth-state');

  try {
    await router.goto(Route.login());
    await render(Page, load);
    await settle();

    expect(api.finishOAuth).toHaveBeenCalledWith({ body: { url: location.href } });
    expect(router.url.pathname).toBe(Route.photos());
  } finally {
    history.replaceState({}, '', path);
  }
});
