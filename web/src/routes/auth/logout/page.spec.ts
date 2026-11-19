import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { Route } from '#lib/route.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect } from 'vitest';
import Page from './+page.svelte';

test('logs out and returns to the login page', async ({ router, render, settle, api }) => {
  await authManager.load();
  await router.goto(Route.logout());

  await render(Page, () => Promise.resolve({}));
  await settle();

  expect(api.logout).toHaveBeenCalled();
  expect(authManager.authenticated).toBe(false);
  expect(router.url.pathname).toBe(Route.login());
});
