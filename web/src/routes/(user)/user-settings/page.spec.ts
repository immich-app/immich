import { OpenQueryParam } from '#lib/constants.ts';
import { Route } from '#lib/route.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect } from 'vitest';
import Page from './+page.svelte';
import { load } from './+page.ts';

test('links to the OAuth account management page', async ({ data, router, render, app }) => {
  data.user.oauthId = 'oauth-user';
  data.userConfig.oauth.enabled = true;
  data.userConfig.oauth.accountManagementUrl = 'https://idp.example/account';
  await router.goto(Route.userSettings({ isOpen: OpenQueryParam.OAUTH }));

  await render(Page, load);

  await expect.element(app.settings.manageOauthAccountLink).toHaveAttribute('href', 'https://idp.example/account');
});

test('rotates an api key', async ({ data, router, render, settle, api, app }) => {
  const apiKey = factory.apiKey({ name: 'CLI' });
  data.addApiKeys(apiKey);
  await router.goto(Route.userSettings());
  await render(Page, load);
  await app.settings.section('api_keys').click();

  await app.settings.rotateApiKeyButton.click();
  await app.cancelButton.click();
  await settle();

  expect(api.rotateApiKey).not.toHaveBeenCalled();

  await app.settings.rotateApiKeyButton.click();
  await app.confirmButton.click();
  await settle();

  expect(api.rotateApiKey).toHaveBeenCalledWith({ params: { id: apiKey.id } });
  await app.settings.apiKeySecretDoneButton.click();
});

test('deletes an api key', async ({ data, router, render, settle, api, app }) => {
  const apiKey = factory.apiKey({ name: 'CLI' });
  data.addApiKeys(apiKey);
  await router.goto(Route.userSettings());
  await render(Page, load);
  await app.settings.section('api_keys').click();

  await app.settings.deleteApiKeyButton.click();
  await app.cancelButton.click();
  await settle();

  expect(api.deleteApiKey).not.toHaveBeenCalled();

  await app.settings.deleteApiKeyButton.click();
  await app.confirmButton.click();
  await settle();

  expect(api.deleteApiKey).toHaveBeenCalledWith({ params: { id: apiKey.id } });
});

test('deletes a passkey', async ({ data, router, render, settle, api, app }) => {
  const passkey = factory.passkey({ name: 'Laptop' });
  data.addPasskeys(passkey);
  await router.goto(Route.userSettings());
  await render(Page, load);
  await app.settings.section('passkeys').click();

  await app.settings.deletePasskeyButton.click();
  await app.cancelButton.click();
  await settle();

  expect(api.deletePasskey).not.toHaveBeenCalled();

  await app.settings.deletePasskeyButton.click();
  await app.confirmButton.click();
  await settle();

  expect(api.deletePasskey).toHaveBeenCalledWith({ params: { id: passkey.id } });
});

test('logs out a device', async ({ data, router, render, settle, api, app }) => {
  const other = factory.session({ deviceOS: 'iOS' });
  data.addSessions([factory.session({ current: true }), other]);
  await router.goto(Route.userSettings());
  await render(Page, load);
  await app.settings.section('authorized_devices').click();

  await app.settings.logOutDeviceButton.click();
  await app.cancelButton.click();
  await settle();

  expect(api.deleteSession).not.toHaveBeenCalled();

  await app.settings.logOutDeviceButton.click();
  await app.confirmButton.click();
  await settle();

  expect(api.deleteSession).toHaveBeenCalledWith({ params: { id: other.id } });
});

test('logs out all devices', async ({ data, router, render, settle, api, app }) => {
  data.addSessions([factory.session({ current: true }), factory.session()]);
  await router.goto(Route.userSettings());
  await render(Page, load);
  await app.settings.section('authorized_devices').click();

  await app.settings.logOutAllDevicesButton.click();
  await app.cancelButton.click();
  await settle();

  expect(api.deleteAllSessions).not.toHaveBeenCalled();

  await app.settings.logOutAllDevicesButton.click();
  await app.confirmButton.click();
  await settle();

  expect(api.deleteAllSessions).toHaveBeenCalled();
});

test('offers to set up a PIN code when none is set', async ({ router, render, settle, app }) => {
  await router.goto(`${Route.userSettings()}?isOpen=user-pin-code-settings`);

  await render(Page, load);
  await settle();

  await expect.element(app.settings.pinCodeTitle('setup_pin_code')).toBeVisible();
});

test('offers to change the PIN code when one is set', async ({ data, router, render, settle, app }) => {
  data.setAuthStatus({ pinCode: true });
  await router.goto(`${Route.userSettings()}?isOpen=user-pin-code-settings`);

  await render(Page, load);
  await settle();

  await expect.element(app.settings.pinCodeTitle('change_pin_code')).toBeVisible();
});
