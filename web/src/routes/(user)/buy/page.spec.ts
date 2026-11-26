import { Route } from '#lib/route.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect } from 'vitest';
import Page from './+page.svelte';
import { load } from './+page.ts';

const licenseKey = 'IMSV-AAAA-BBBB-CCCC-DDDD-EEEE-FFFF-GGGG-HHHH';
const activationKey = 'activation-key';
const buyUrl = `${Route.buy()}?licenseKey=${licenseKey}&activationKey=${activationKey}`;

test('activates a server license for an admin', async ({ router, render, api, app }) => {
  await router.goto(buyUrl);

  await render(Page, load);

  expect(api.setServerLicense).toHaveBeenCalledWith({ body: { licenseKey, activationKey } });
  expect(api.setUserLicense).not.toHaveBeenCalled();
  await expect.element(app.purchase.activatedTitle).toBeVisible();
});

test('activates a user license for a non-admin', async ({ data, router, render, api, app }) => {
  data.user.isAdmin = false;
  await router.goto(buyUrl);

  await render(Page, load);

  expect(api.setUserLicense).toHaveBeenCalledWith({ body: { licenseKey, activationKey } });
  expect(api.setServerLicense).not.toHaveBeenCalled();
  await expect.element(app.purchase.activatedTitle).toBeVisible();
});

test('shows an error when the license is rejected', async ({ router, render, api, app }) => {
  api.on({ setServerLicense: () => ({ status: 400, json: { message: 'Invalid license key', statusCode: 400 } }) });
  await router.goto(buyUrl);

  await render(Page, load);

  expect(api.setServerLicense).toHaveBeenCalledWith({ body: { licenseKey, activationKey } });
  await expect.element(app.purchase.failedAlert).toBeVisible();
  await expect.element(app.purchase.activatedTitle).not.toBeInTheDocument();
});
