import { Route } from '#lib/route.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect } from 'vitest';
import Page from './+page.svelte';
import { load } from './+page.ts';

test('finishes onboarding as a user', async ({ data, router, render, settle, api, app }) => {
  data.user.isAdmin = false;
  await router.goto(Route.onboarding({ step: 'mobile_app' }));
  await render(Page, load);

  await app.onboarding.doneButton.click();
  await settle();

  expect(api.setUserOnboarding).toHaveBeenCalledWith({ body: { isOnboarded: true } });
  expect(api.updateAdminOnboarding).not.toHaveBeenCalled();
  await expect.poll(() => router.url.pathname).toBe('/photos');
});

test('finishes onboarding as an admin', async ({ data, router, render, settle, api, app }) => {
  data.isOnboarded = false;
  await router.goto(Route.onboarding({ step: 'mobile_app' }));
  await render(Page, load);

  await app.onboarding.doneButton.click();
  await settle();

  expect(api.updateAdminOnboarding).toHaveBeenCalledWith({ body: { isOnboarded: true } });
  expect(api.setUserOnboarding).toHaveBeenCalledWith({ body: { isOnboarded: true } });
  await expect.poll(() => router.url.pathname).toBe('/photos');
});

test('stays on the last step when finishing as an admin fails', async ({
  router,
  render,
  settle,
  api,
  logger,
  app,
}) => {
  api.on({ updateAdminOnboarding: () => ({ status: 500, json: { message: 'Server error', statusCode: 500 } }) });
  await router.goto(Route.onboarding({ step: 'mobile_app' }));
  await render(Page, load);

  await app.onboarding.doneButton.click();
  await settle();

  expect(api.updateAdminOnboarding).toHaveBeenCalled();
  expect(api.setUserOnboarding).not.toHaveBeenCalled();
  expect(router.url.pathname).toBe('/auth/onboarding');
  expect(logger.error).toHaveBeenCalledWith(/handleError/);
});
