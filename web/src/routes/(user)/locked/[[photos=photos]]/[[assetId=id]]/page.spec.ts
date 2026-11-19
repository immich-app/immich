import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { Route } from '#lib/route.ts';
import { test } from '#test/unit/fixtures.ts';
import { isRedirect } from '@sveltejs/kit';
import { expect } from 'vitest';
import Page from './+page.svelte';
import { load } from './+page.ts';

const runLoad = async (url: string) => {
  await authManager.load();
  try {
    return await load({ url: new URL(url, location.origin) } as never);
  } catch (error) {
    if (isRedirect(error)) {
      return { redirect: error.location };
    }
    throw error;
  }
};

test('prompts for the PIN code when the session is not elevated', async ({ data }) => {
  data.setAuthStatus({ pinCode: true, isElevated: false });

  await expect(runLoad(Route.locked())).resolves.toEqual({ redirect: Route.pinPrompt({ continue: Route.locked() }) });
});

test('prompts to set up a PIN code when none is set', async () => {
  await expect(runLoad(Route.locked())).resolves.toEqual({ redirect: Route.pinPrompt({ continue: Route.locked() }) });
});

test('opens the locked folder when the session is elevated', async ({ data }) => {
  data.setAuthStatus({ pinCode: true, isElevated: true });

  await expect(runLoad(Route.locked())).resolves.toMatchObject({ meta: { title: 'locked_folder' } });
});

test('locks the session and leaves the locked folder', async ({ data, router, render, settle, api, app }) => {
  data.setAuthStatus({ pinCode: true, isElevated: true });
  await router.goto(Route.locked());
  await render(Page, load);
  await settle();

  await app.auth.button('lock').click();
  await settle();

  expect(api.lockAuthSession).toHaveBeenCalled();
  expect(router.url.pathname).toBe(Route.photos());
});

test('stays in the locked folder when locking fails', async ({ data, router, render, settle, api, app, logger }) => {
  data.setAuthStatus({ pinCode: true, isElevated: true });
  api.on({ lockAuthSession: () => ({ status: 500, json: { message: 'Server error', statusCode: 500 } }) });
  await router.goto(Route.locked());
  await render(Page, load);
  await settle();

  await app.auth.button('lock').click();
  await settle();

  expect(api.lockAuthSession).toHaveBeenCalled();
  expect(logger.error).toHaveBeenCalledWith(/handleError/);
  await expect.element(app.toast(/Server error/)).toBeVisible();
  expect(router.url.pathname).toBe(Route.locked());
});

test('prompts for the PIN code when reopening after locking', async ({ data, router, render, settle, api, app }) => {
  data.setAuthStatus({ pinCode: true, isElevated: true });
  await router.goto(Route.locked());
  await render(Page, load);
  await settle();

  await app.auth.button('lock').click();
  await settle();
  expect(api.lockAuthSession).toHaveBeenCalled();

  await expect(runLoad(Route.locked())).resolves.toEqual({ redirect: Route.pinPrompt({ continue: Route.locked() }) });
});

test('opens the locked folder after locking and unlocking again', async ({
  data,
  router,
  render,
  settle,
  api,
  app,
}) => {
  data.setAuthStatus({ pinCode: true, isElevated: true });
  await router.goto(Route.locked());
  await render(Page, load);
  await settle();
  await app.auth.button('lock').click();
  await settle();
  expect(api.lockAuthSession).toHaveBeenCalled();

  data.setAuthStatus({ isElevated: true });

  await expect(runLoad(Route.locked())).resolves.toMatchObject({ meta: { title: 'locked_folder' } });
});
