import { Route } from '#lib/route.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect } from 'vitest';
import { userEvent } from 'vitest/browser';
import Page from './+page.svelte';
import { load } from './+page.ts';

test('unlocks the session and continues to the locked folder', async ({ data, router, render, settle, api }) => {
  data.setAuthStatus({ pinCode: true });
  await router.goto(Route.pinPrompt());
  await render(Page, load);

  await userEvent.keyboard('123456');
  await settle();

  expect(api.unlockAuthSession).toHaveBeenCalledWith({ body: { pinCode: '123456' } });
  await expect.poll(() => router.url.pathname, { timeout: 3000 }).toBe(Route.locked());
});

test('continues to the requested page after unlocking', async ({ data, router, render, settle, api }) => {
  data.setAuthStatus({ pinCode: true });
  await router.goto(Route.pinPrompt({ continue: '/locked/photos' }));
  await render(Page, load);

  await userEvent.keyboard('123456');
  await settle();

  expect(api.unlockAuthSession).toHaveBeenCalledWith({ body: { pinCode: '123456' } });
  await expect.poll(() => router.url.pathname, { timeout: 3000 }).toBe('/locked/photos');
});

test('stays on the prompt for a wrong PIN code', async ({ data, router, render, settle, api, logger }) => {
  data.setAuthStatus({ pinCode: true });
  api.on({ unlockAuthSession: () => ({ status: 400, json: { message: 'Wrong PIN code', statusCode: 400 } }) });
  await router.goto(Route.pinPrompt());
  await render(Page, load);

  await userEvent.keyboard('000000');
  await settle();

  expect(api.unlockAuthSession).toHaveBeenCalledWith({ body: { pinCode: '000000' } });
  expect(logger.error).toHaveBeenCalledWith(/handleError/);
  expect(router.url.pathname).toBe(Route.pinPrompt());
});

test('sets up a PIN code when none is set', async ({ router, render, settle, api, app }) => {
  await router.goto(Route.pinPrompt());
  await render(Page, load);

  await app.auth.input('new_pin_code').click();
  await userEvent.keyboard('123456');
  await app.auth.input('confirm_new_pin_code').click();
  await userEvent.keyboard('123456');
  await app.auth.button('create').click();
  await settle();

  expect(api.setupPinCode).toHaveBeenCalledWith({ body: { pinCode: '123456' } });
  await expect.element(app.auth.text('enter_your_pin_code_subtitle')).toBeVisible();
});

test('cancels back to photos', async ({ data, router, render, app }) => {
  data.setAuthStatus({ pinCode: true });
  await router.goto(Route.pinPrompt());
  await render(Page, load);

  await app.auth.button('cancel').click();

  expect(router.url.pathname).toBe(Route.photos());
});
