import { OpenQueryParam } from '#lib/constants.ts';
import { Route } from '#lib/route.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { PartnerDirection } from '@immich/sdk';
import { expect } from 'vitest';
import { userEvent } from 'vitest/browser';
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

test('changes the PIN code', async ({ data, router, render, settle, api, app }) => {
  data.setAuthStatus({ pinCode: true });
  await router.goto(`${Route.userSettings()}?isOpen=user-pin-code-settings`);
  await render(Page, load);
  await settle();

  await app.auth.input('current_pin_code').click();
  await userEvent.keyboard('123456');
  await app.auth.input('new_pin_code').click();
  await userEvent.keyboard('654321');
  await app.auth.input('confirm_new_pin_code').click();
  await userEvent.keyboard('654321');
  await app.auth.button('save').click();
  await settle();

  expect(api.changePinCode).toHaveBeenCalledWith({ body: { pinCode: '123456', newPinCode: '654321' } });
});

test('resets the PIN code with the account password', async ({ data, router, render, settle, api, app }) => {
  data.setAuthStatus({ pinCode: true });
  await router.goto(`${Route.userSettings()}?isOpen=user-pin-code-settings`);
  await render(Page, load);
  await settle();

  await app.settings.forgotPinCodeButton.click();
  await app.auth.input('confirm_password').fill('password');
  await app.dialogButton('reset').click();
  await settle();

  expect(api.resetPinCode).toHaveBeenCalledWith({ body: { password: 'password' } });
  await expect.element(app.settings.pinCodeTitle('setup_pin_code')).toBeVisible();
});

test('unlinks the OAuth account', async ({ data, router, render, settle, api, app }) => {
  data.user.oauthId = 'oauth-user';
  data.userConfig.oauth.enabled = true;
  await router.goto(Route.userSettings({ isOpen: OpenQueryParam.OAUTH }));
  await render(Page, load);

  await app.settings.unlinkOauthButton.click();
  await settle();

  expect(api.unlinkOAuthAccount).toHaveBeenCalled();
  await expect.element(app.auth.button('link_to_oauth')).toBeVisible();
});

test('starts linking an OAuth account from the login page', async ({ data, router, render, settle, app }) => {
  data.userConfig.oauth.enabled = true;
  await router.goto(Route.userSettings({ isOpen: OpenQueryParam.OAUTH }));
  await render(Page, load);

  await app.auth.button('link_to_oauth').click();
  await settle();

  expect(router.url.pathname + router.url.search).toBe(Route.login({ autoLaunch: 1 }));
});

test('adds a partner', async ({ data, router, render, settle, api, app }) => {
  const user = factory.user({ name: 'Alice' });
  data.addUsers(user);
  await router.goto(Route.userSettings({ isOpen: OpenQueryParam.SHARING }));
  await render(Page, load);
  await app.settings.section('partners').click();

  await app.settings.partners.addButton.click();
  await app.userPicker.user('Alice').click();
  await app.userPicker.addButton.click();
  await settle();

  expect(api.createPartner).toHaveBeenCalledWith({ body: { sharedWithId: user.id } });
  await expect.element(app.settings.partners.removeButton).toBeVisible();
});

test('removes a partner', async ({ data, router, render, settle, api, app }) => {
  const partner = factory.partner({ name: 'Alice' });
  data.addPartners(PartnerDirection.SharedBy, partner);
  await router.goto(Route.userSettings({ isOpen: OpenQueryParam.SHARING }));
  await render(Page, load);
  await app.settings.section('partners').click();

  await app.settings.partners.removeButton.click();
  await app.cancelButton.click();
  await settle();

  expect(api.removePartner).not.toHaveBeenCalled();

  await app.settings.partners.removeButton.click();
  await app.confirmButton.click();
  await settle();

  expect(api.removePartner).toHaveBeenCalledWith({ params: { id: partner.id } });
  await expect.element(app.settings.partners.removeButton).not.toBeInTheDocument();
});

test('shows a partner in the timeline', async ({ data, router, render, settle, api, app }) => {
  const partner = factory.partner({ name: 'Alice', inTimeline: false });
  data.addPartners(PartnerDirection.SharedWith, partner);
  await router.goto(Route.userSettings({ isOpen: OpenQueryParam.SHARING }));
  await render(Page, load);
  await app.settings.section('partners').click();

  await app.settings.partners.showInTimelineSwitch.click();
  await settle();

  expect(api.updatePartner).toHaveBeenCalledWith({ params: { id: partner.id }, body: { inTimeline: true } });
});

test('requests to add a user to the cluster group', async ({ data, router, render, settle, api, app }) => {
  const user = factory.user({ name: 'Alice' });
  data.addUsers(user);
  await router.goto(Route.userSettings({ isOpen: OpenQueryParam.SHARING }));
  await render(Page, load);
  await app.settings.section('people_cluster_group').click();

  await app.settings.clusterGroup.addUserButton.click();
  await app.userPicker.user('Alice').click();
  await app.userPicker.addButton.click();
  await settle();

  expect(api.createClusterGroupRequest).toHaveBeenCalledWith({
    params: { id: data.user.clusterGroupId },
    body: { userId: user.id },
  });
  await expect.element(app.settings.clusterGroup.cancelRequestButton).toBeVisible();
});

test('accepts a cluster group request', async ({ data, router, render, settle, api, app }) => {
  const request = factory.clusterGroupRequest({ userId: data.user.id });
  data.addClusterGroupRequests(request);
  await router.goto(Route.userSettings({ isOpen: OpenQueryParam.SHARING }));
  await render(Page, load);
  await app.settings.section('people_cluster_group').click();

  await app.settings.clusterGroup.viewGroupButton.click();
  await app.dialogButton('accept').click();
  await settle();

  expect(api.acceptClusterGroupRequest).toHaveBeenCalledWith({ params: { id: request.id } });
  await expect.element(app.settings.clusterGroup.viewGroupButton).not.toBeInTheDocument();
});

test('declines a cluster group request', async ({ data, router, render, settle, api, app }) => {
  const request = factory.clusterGroupRequest({ userId: data.user.id });
  data.addClusterGroupRequests(request);
  await router.goto(Route.userSettings({ isOpen: OpenQueryParam.SHARING }));
  await render(Page, load);
  await app.settings.section('people_cluster_group').click();

  await app.settings.clusterGroup.viewGroupButton.click();
  await app.dialogButton('decline').click();
  await settle();

  expect(api.deleteClusterGroupRequest).toHaveBeenCalledWith({ params: { id: request.id } });
  expect(api.acceptClusterGroupRequest).not.toHaveBeenCalled();
  await expect.element(app.settings.clusterGroup.viewGroupButton).not.toBeInTheDocument();
});

test('cancels a sent cluster group request', async ({ data, router, render, settle, api, app }) => {
  const user = factory.user({ name: 'Alice' });
  const request = factory.clusterGroupRequest({ clusterGroupId: data.user.clusterGroupId, userId: user.id });
  data.addUsers(user).addClusterGroupRequests(request);
  await router.goto(Route.userSettings({ isOpen: OpenQueryParam.SHARING }));
  await render(Page, load);
  await app.settings.section('people_cluster_group').click();

  await app.settings.clusterGroup.cancelRequestButton.click();
  await settle();

  expect(api.deleteClusterGroupRequest).toHaveBeenCalledWith({ params: { id: request.id } });
  await expect.element(app.settings.clusterGroup.cancelRequestButton).not.toBeInTheDocument();
});

test('leaves the cluster group', async ({ data, router, render, settle, api, app }) => {
  const clusterGroupId = data.user.clusterGroupId;
  data.addUsers({ name: 'Alice', clusterGroupId });
  await router.goto(Route.userSettings({ isOpen: OpenQueryParam.SHARING }));
  await render(Page, load);
  await app.settings.section('people_cluster_group').click();

  await app.settings.clusterGroup.leaveButton.click();
  await app.cancelButton.click();
  await settle();

  expect(api.leaveClusterGroup).not.toHaveBeenCalled();

  await app.settings.clusterGroup.leaveButton.click();
  await app.confirmButton.click();
  await settle();

  expect(api.leaveClusterGroup).toHaveBeenCalledWith({ params: { id: clusterGroupId } });
  await expect.element(app.settings.clusterGroup.leaveButton).not.toBeInTheDocument();
});

test('reruns facial recognition for the cluster group', async ({ data, router, render, settle, api, app }) => {
  await router.goto(Route.userSettings({ isOpen: OpenQueryParam.SHARING }));
  await render(Page, load);
  await app.settings.section('people_cluster_group').click();

  await app.settings.clusterGroup.facialRecognitionButton.click();
  await app.cancelButton.click();
  await settle();

  expect(api.clusterGroupRegeneratePeople).not.toHaveBeenCalled();

  await app.settings.clusterGroup.facialRecognitionButton.click();
  await app.confirmButton.click();
  await settle();

  expect(api.clusterGroupRegeneratePeople).toHaveBeenCalledWith({ params: { id: data.user.clusterGroupId } });
});
