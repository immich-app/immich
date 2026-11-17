import { featureFlagsManager } from '#lib/managers/feature-flags-manager.svelte.ts';
import { Route } from '#lib/route.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect } from 'vitest';
import Page from './+page.svelte';
import { load } from './+page.ts';

const email = 'user@immich.cloud';

test('links the OAuth account by logging in with a password', async ({ router, render, settle, api, app }) => {
  await router.goto(Route.authLink({ email }));
  await render(Page, load);

  await app.auth.input('password').fill('password');
  await app.auth.loginButton.click();
  await settle();

  expect(api.login).toHaveBeenCalledWith({ body: { email, password: 'password' } });
  expect(router.url.pathname).toBe(Route.photos());
});

test('shows an error for an incorrect password', async ({ router, render, settle, api, app }) => {
  api.on({ login: () => ({ status: 401, json: { message: 'Incorrect email or password', statusCode: 401 } }) });
  await router.goto(Route.authLink({ email }));
  await render(Page, load);

  await app.auth.input('password').fill('wrong');
  await app.auth.loginButton.click();
  await settle();

  expect(api.login).toHaveBeenCalledWith({ body: { email, password: 'wrong' } });
  await expect.element(app.auth.text('Incorrect email or password')).toBeVisible();
  expect(router.url.pathname).toBe('/auth/link');
});

test('registers a new account when auto register is enabled', async ({ data, router, render, settle, api, app }) => {
  data.serverFeatures.oauthAutoRegister = true;
  await featureFlagsManager.init();
  await router.goto(Route.authLink({ email }));
  await render(Page, load);

  await app.auth.button('create_new_account').click();
  await settle();

  expect(api.register).toHaveBeenCalled();
  expect(router.url.pathname).toBe(Route.photos());
});

test('does not offer registration when auto register is disabled', async ({ router, render, app }) => {
  await router.goto(Route.authLink({ email }));
  await render(Page, load);

  await expect.element(app.auth.loginButton).toBeVisible();
  await expect.element(app.auth.button('create_new_account')).not.toBeInTheDocument();
});
