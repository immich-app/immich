import { queryClient } from '#lib/queries/client.ts';
import { getServerConfigQuery } from '#lib/queries/server-info.query.ts';
import { Route } from '#lib/route.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect } from 'vitest';
import Page from './+page.svelte';
import { load } from './+page.ts';

const uninitialize = async (data: { serverConfig: { isInitialized: boolean } }) => {
  data.serverConfig.isInitialized = false;
  await queryClient.refetchQueries({ queryKey: getServerConfigQuery().queryKey, exact: true });
};

test('registers the admin account', async ({ data, router, render, settle, api, app }) => {
  await uninitialize(data);
  await router.goto(Route.register());
  await render(Page, load);

  await app.auth.input('admin_email').fill('new-admin@immich.cloud');
  await app.auth.input('admin_password').fill('password');
  await app.auth.input('confirm_admin_password').fill('password');
  await app.auth.input('name').fill('New Admin');
  await app.auth.signUpButton.click();
  await settle();

  expect(api.signUpAdmin).toHaveBeenCalledWith({
    body: { email: 'new-admin@immich.cloud', password: 'password', name: 'New Admin' },
  });
  expect(queryClient.getQueryData(getServerConfigQuery().queryKey)).toMatchObject({ isInitialized: true });
  expect(router.url.pathname).toBe(Route.login());
});

test('does not register when the passwords do not match', async ({ data, router, render, app }) => {
  await uninitialize(data);
  await router.goto(Route.register());
  await render(Page, load);

  await app.auth.input('admin_password').fill('password');
  await app.auth.input('confirm_admin_password').fill('different');

  await expect.element(app.auth.text('password_does_not_match')).toBeVisible();
  await expect.element(app.auth.signUpButton).toBeDisabled();
});

test('redirects to login when the server is initialized', async ({ router, render }) => {
  await router.goto(Route.register());

  await expect(render(Page, load)).rejects.toThrow(`redirected to ${Route.login()}`);
});
