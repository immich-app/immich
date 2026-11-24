import { Route } from '#lib/route.ts';
import { test } from '#test/unit/fixtures.ts';
import { ConfigSource } from '@immich/sdk';
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

test('keeps a locked storage template off', async ({ data, router, render, app }) => {
  data.isOnboarded = false;
  data.adminConfigFields = [
    {
      key: 'storageTemplate.enabled',
      envName: 'IMMICH_CONFIG_STORAGE_TEMPLATE_ENABLED',
      value: false,
      sources: [
        { source: ConfigSource.Default, value: false },
        { source: ConfigSource.Env, value: false },
      ],
      isEditable: false,
    },
  ];
  await router.goto(Route.onboarding({ step: 'storage_template' }));
  await render(Page, load);

  await expect.element(app.admin.settings.storageTemplate.option('admin.storage_template_option_none')).toBeChecked();
});
