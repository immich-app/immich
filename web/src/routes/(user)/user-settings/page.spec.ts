import { OpenQueryParam, QueryParameter } from '#lib/constants.ts';
import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import PeopleFilterModal from '#lib/modals/PeopleFilterModal.svelte';
import { Route } from '#lib/route.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import {
  AssetOrder,
  AssetTypeEnum,
  AssetVisibility,
  CalendarHeatmapType,
  PartnerDirection,
  PersonUpdateStrategy,
} from '@immich/sdk';
import { expect, vi } from 'vitest';
import { render as renderModal } from 'vitest-browser-svelte';
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

test('links the OAuth account from the callback url', async ({ data, router, render, settle, api }) => {
  data.userConfig.oauth.enabled = true;
  const path = location.pathname;
  history.replaceState({}, '', '?code=oauth-code&state=oauth-state');

  try {
    await router.goto(Route.userSettings());
    await render(Page, load);
    await settle();

    expect(api.linkOAuthAccount).toHaveBeenCalledWith({ body: { url: location.href } });
    expect(router.url.pathname).toBe(Route.userSettings());
    expect(router.url.searchParams.get(QueryParameter.IS_OPEN)).toBe(OpenQueryParam.OAUTH);
  } finally {
    history.replaceState({}, '', path);
  }
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

test('adds the remaining partners when one fails', async ({ data, router, render, settle, api, app, logger }) => {
  const [alice, bob] = [factory.user({ name: 'Alice' }), factory.user({ name: 'Bob' })];
  data.addUsers([alice, bob]);
  api.on({
    createPartner: ({ body }) =>
      body.sharedWithId === alice.id
        ? { status: 400, json: { message: 'Partner failed', statusCode: 400 } }
        : { status: 201, json: data.createPartner(body.sharedWithId) },
  });
  await router.goto(Route.userSettings({ isOpen: OpenQueryParam.SHARING }));
  await render(Page, load);
  await app.settings.section('partners').click();

  await app.settings.partners.addButton.click();
  await app.userPicker.user('Alice').click();
  await app.userPicker.user('Bob').click();
  await app.userPicker.addButton.click();
  await settle();

  expect(api.createPartner).toHaveBeenCalledWith({ body: { sharedWithId: alice.id } });
  expect(api.createPartner).toHaveBeenCalledWith({ body: { sharedWithId: bob.id } });
  expect(logger.error).toHaveBeenCalledWith(/handleError/);
  await expect.element(app.settings.partners.removeButton).toBeVisible();
});

test('shows a mutual partner as shared both ways', async ({ data, router, render, app }) => {
  const partner = factory.partner({ name: 'Alice' });
  data.addPartners(PartnerDirection.SharedBy, partner).addPartners(PartnerDirection.SharedWith, partner);
  await router.goto(Route.userSettings({ isOpen: OpenQueryParam.SHARING }));
  await render(Page, load);
  await app.settings.section('partners').click();

  await expect.element(app.settings.partners.removeButton).toBeVisible();
  await expect.element(app.settings.partners.showInTimelineSwitch).toBeVisible();
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

test('offers the new cluster group users after accepting a request', async ({
  data,
  router,
  render,
  settle,
  api,
  app,
}) => {
  const groupId = crypto.randomUUID();
  data.addUsers([
    { name: 'Olga Old', clusterGroupId: data.user.clusterGroupId },
    { name: 'Nina New', clusterGroupId: groupId },
  ]);
  const request = factory.clusterGroupRequest({ clusterGroupId: groupId, userId: data.user.id });
  data.addClusterGroupRequests(request);
  await router.goto(Route.userSettings({ isOpen: OpenQueryParam.SHARING }));
  await render(Page, load);
  await app.settings.section('people_cluster_group').click();
  await expect.element(app.settings.clusterGroup.leaveButton).toBeVisible();

  await app.settings.clusterGroup.viewGroupButton.click();
  await app.dialogButton('accept').click();
  await settle();
  await renderModal(PeopleFilterModal, { filter: {}, onClose: vi.fn() });
  await app.people.filterSharedByButton.click();

  expect(api.acceptClusterGroupRequest).toHaveBeenCalledWith({ params: { id: request.id } });
  await expect.element(app.userPicker.user('Nina New')).toBeVisible();
  await expect.element(app.userPicker.user('Olga Old')).not.toBeInTheDocument();
  await app.userPicker.user('Nina New').click();
  await expect.element(app.people.filterSharedByButton).toHaveTextContent('Nina New');
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

  await app.settings.clusterGroup.facialRecognitionButton.click();
  await app.confirmButton.click();
  await settle();

  expect(data.user.clusterGroupId).not.toBe(clusterGroupId);
  expect(api.clusterGroupRegeneratePeople).toHaveBeenCalledWith({ params: { id: data.user.clusterGroupId } });
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

test('saves the profile', async ({ router, render, settle, api, app }) => {
  await router.goto(Route.userSettings());
  await render(Page, load);
  await app.settings.section('account').click();

  await app.settings.input('name').fill('Alice');
  await app.settings.input('email').fill('alice@immich.cloud');
  await app.settings.saveButton.click();
  await settle();

  expect(api.updateMyUser).toHaveBeenCalledWith({ body: { email: 'alice@immich.cloud', name: 'Alice' } });
  await expect.element(app.toast('saved_profile')).toBeVisible();
  expect(authManager.user).toMatchObject({ name: 'Alice', email: 'alice@immich.cloud' });
});

test('keeps the edited profile when saving fails', async ({ data, router, render, settle, api, app, logger }) => {
  data.user.name = 'Alice';
  api.on({ updateMyUser: () => ({ status: 400, json: { message: 'Email already in use', statusCode: 400 } }) });
  await router.goto(Route.userSettings());
  await render(Page, load);
  await app.settings.section('account').click();

  await app.settings.input('email').fill('taken@immich.cloud');
  await app.settings.saveButton.click();
  await settle();

  expect(api.updateMyUser).toHaveBeenCalledWith({ body: { email: 'taken@immich.cloud', name: 'Alice' } });
  expect(logger.error).toHaveBeenCalledWith(/handleError/);
  await expect.element(app.toast(/Email already in use/)).toBeVisible();
  await expect.element(app.settings.input('email')).toHaveValue('taken@immich.cloud');
});

test('saves the download settings', async ({ router, render, settle, api, app }) => {
  await router.goto(Route.userSettings());
  await render(Page, load);
  await app.settings.section('download_settings').click();

  await app.settings.numberInput.fill('8');
  await app.settings.switch('download_include_embedded_motion_videos').click();
  await app.settings.saveButton.click();
  await settle();

  expect(api.updateMyPreferences).toHaveBeenCalledWith({
    body: { download: { archiveSize: 8_589_934_592, includeEmbeddedVideos: true } },
  });
  await expect.element(app.toast('saved_settings')).toBeVisible();
});

test('keeps the download settings when saving fails', async ({ router, render, settle, api, app, logger }) => {
  api.on({ updateMyPreferences: () => ({ status: 500, json: { message: 'Server error', statusCode: 500 } }) });
  await router.goto(Route.userSettings());
  await render(Page, load);
  await app.settings.section('download_settings').click();

  await app.settings.numberInput.fill('8');
  await app.settings.saveButton.click();
  await settle();

  expect(api.updateMyPreferences).toHaveBeenCalledWith({
    body: { download: { archiveSize: 8_589_934_592, includeEmbeddedVideos: false } },
  });
  expect(logger.error).toHaveBeenCalledWith(/handleError/);
  await expect.element(app.toast(/Server error/)).toBeVisible();
  await expect.element(app.settings.numberInput).toHaveValue(8);
});

test('saves the feature settings', async ({ router, render, settle, api, app }) => {
  await router.goto(Route.userSettings());
  await render(Page, load);
  await app.settings.section('features').click();
  await app.settings.section('rating').click();

  await app.settings.switch('enable').click();
  await app.settings.saveButton.click();
  await settle();

  expect(api.updateMyPreferences).toHaveBeenCalledWith({
    body: {
      albums: { defaultAssetOrder: AssetOrder.Desc },
      folders: { enabled: false, sidebarWeb: false },
      memories: { enabled: true, duration: 5, sidebarWeb: false },
      people: { enabled: true, sidebarWeb: false, minimumFaces: 3, updateStrategy: PersonUpdateStrategy.Everyone },
      ratings: { enabled: true },
      sharedLinks: { enabled: true, sidebarWeb: false },
      tags: { enabled: false, sidebarWeb: false },
      cast: { gCastEnabled: false },
      recentlyAdded: { sidebarWeb: false },
    },
  });
  await expect.element(app.toast('saved_settings')).toBeVisible();
});

test('keeps the feature settings when saving fails', async ({ router, render, settle, api, app, logger }) => {
  api.on({ updateMyPreferences: () => ({ status: 500, json: { message: 'Server error', statusCode: 500 } }) });
  await router.goto(Route.userSettings());
  await render(Page, load);
  await app.settings.section('features').click();
  await app.settings.section('rating').click();

  await app.settings.switch('enable').click();
  await app.settings.saveButton.click();
  await settle();

  expect(api.updateMyPreferences).toHaveBeenCalledWith({
    body: expect.objectContaining({ ratings: { enabled: true } }),
  });
  expect(logger.error).toHaveBeenCalledWith(/handleError/);
  await expect.element(app.toast(/Server error/)).toBeVisible();
  await expect.element(app.settings.switch('enable')).toBeChecked();
});

test('saves the notification settings', async ({ router, render, settle, api, app }) => {
  await router.goto(Route.userSettings());
  await render(Page, load);
  await app.settings.section('notifications ').click();

  await app.settings.switch('enable').click();
  await app.settings.saveButton.click();
  await settle();

  expect(api.updateMyPreferences).toHaveBeenCalledWith({
    body: { emailNotifications: { enabled: false, albumInvite: false, albumUpdate: false } },
  });
  await expect.element(app.toast('saved_settings')).toBeVisible();
});

test('keeps the notification settings when saving fails', async ({ router, render, settle, api, app, logger }) => {
  api.on({ updateMyPreferences: () => ({ status: 500, json: { message: 'Server error', statusCode: 500 } }) });
  await router.goto(Route.userSettings());
  await render(Page, load);
  await app.settings.section('notifications ').click();

  await app.settings.switch('enable').click();
  await app.settings.saveButton.click();
  await settle();

  expect(api.updateMyPreferences).toHaveBeenCalledWith({
    body: { emailNotifications: { enabled: false, albumInvite: false, albumUpdate: false } },
  });
  expect(logger.error).toHaveBeenCalledWith(/handleError/);
  await expect.element(app.toast(/Server error/)).toBeVisible();
  await expect.element(app.settings.switch('enable')).not.toBeChecked();
});

test('changes the password', async ({ router, render, settle, api, app }) => {
  await router.goto(Route.userSettings());
  await render(Page, load);
  await app.settings.section('password').click();

  await app.settings.input('password').fill('old-password');
  await app.settings.input('new_password').fill('new-password');
  await app.settings.input('confirm_password').fill('new-password');
  await app.settings.switch('log_out_all_devices').click();
  await app.settings.saveButton.click();
  await settle();

  expect(api.changePassword).toHaveBeenCalledWith({
    body: { password: 'old-password', newPassword: 'new-password', invalidateSessions: true },
  });
  await expect.element(app.toast('updated_password')).toBeVisible();
  await expect.element(app.settings.input('password')).toHaveValue('');
});

test('keeps the password form when changing fails', async ({ router, render, settle, api, app, logger }) => {
  api.on({ changePassword: () => ({ status: 400, json: { message: 'Wrong password', statusCode: 400 } }) });
  await router.goto(Route.userSettings());
  await render(Page, load);
  await app.settings.section('password').click();

  await app.settings.input('password').fill('wrong-password');
  await app.settings.input('new_password').fill('new-password');
  await app.settings.input('confirm_password').fill('new-password');
  await app.settings.saveButton.click();
  await settle();

  expect(api.changePassword).toHaveBeenCalledWith({
    body: { password: 'wrong-password', newPassword: 'new-password', invalidateSessions: false },
  });
  expect(logger.error).toHaveBeenCalledWith(/handleError/);
  await expect.element(app.toast(/Wrong password/)).toBeVisible();
  await expect.element(app.settings.input('password')).toHaveValue('wrong-password');
});

test('shows the usage statistics', async ({ data, router, render, settle, api, app }) => {
  data.addAssets([
    factory.asset(),
    factory.asset({ type: AssetTypeEnum.Video }),
    factory.asset({ isFavorite: true }),
    factory.asset({ visibility: AssetVisibility.Archive }),
    factory.asset({ isTrashed: true }),
  ]);
  await router.goto(Route.userSettings());
  await render(Page, load);

  await app.settings.section('user_usage_stats').click();
  await settle();

  await expect.element(app.settings.usageCell('timeline', 1)).toHaveTextContent('2');
  await expect.element(app.settings.usageCell('timeline', 2)).toHaveTextContent('1');
  await expect.element(app.settings.usageCell('timeline', 3)).toHaveTextContent('3');
  await expect.element(app.settings.usageCell('favorites', 3)).toHaveTextContent('1');
  await expect.element(app.settings.usageCell('archive', 3)).toHaveTextContent('1');
  await expect.element(app.settings.usageCell('trash', 3)).toHaveTextContent('1');
  expect(api.getMyCalendarHeatmap).toHaveBeenCalledWith({
    params: { $from: expect.any(String), to: expect.any(String), $type: CalendarHeatmapType.Upload },
  });
  expect(api.getMyCalendarHeatmap).toHaveBeenCalledWith({
    params: { $from: expect.any(String), to: expect.any(String), $type: CalendarHeatmapType.Taken },
  });
});

const serverKey = 'IMSV-AAAA-BBBB-CCCC-DDDD-EEEE-FFFF-GGGG-HHHH';

test('removes the individual product key', async ({ data, router, render, settle, api, app }) => {
  data.user.license = factory.license();
  await router.goto(Route.userSettings({ isOpen: OpenQueryParam.PURCHASE_SETTINGS }));
  await render(Page, load);
  await settle();

  await app.settings.purchase.removeKeyButton.click();
  await app.cancelButton.click();
  await settle();

  expect(api.deleteUserLicense).not.toHaveBeenCalled();

  await app.settings.purchase.removeKeyButton.click();
  await app.settings.purchase.removeButton.click();
  await settle();

  expect(api.deleteUserLicense).toHaveBeenCalled();
  expect(api.deleteServerLicense).not.toHaveBeenCalled();
  await expect.element(app.settings.purchase.productKeyInput).toBeVisible();
});

test('removes the server product key', async ({ data, router, render, settle, api, app }) => {
  data.setServerLicense({ licenseKey: serverKey, activationKey: 'activation-key' });
  await router.goto(Route.userSettings({ isOpen: OpenQueryParam.PURCHASE_SETTINGS }));
  await render(Page, load);
  await settle();

  await app.settings.purchase.removeKeyButton.click();
  await app.cancelButton.click();
  await settle();

  expect(api.deleteServerLicense).not.toHaveBeenCalled();

  await app.settings.purchase.removeKeyButton.click();
  await app.settings.purchase.removeButton.click();
  await settle();

  expect(api.deleteServerLicense).toHaveBeenCalled();
  expect(api.deleteUserLicense).not.toHaveBeenCalled();
  await expect.element(app.settings.purchase.productKeyInput).toBeVisible();
});

test('shows the supporter badge', async ({ data, router, render, settle, api, app }) => {
  data.user.license = factory.license();
  await router.goto(Route.userSettings({ isOpen: OpenQueryParam.PURCHASE_SETTINGS }));
  await render(Page, load);
  await settle();

  await app.settings.switch('show_supporter_badge').click();
  await settle();

  expect(api.updateMyPreferences).toHaveBeenCalledWith({ body: { purchase: { showSupportBadge: true } } });
});

test('shows an error when linking the OAuth account fails', async ({ data, router, render, settle, api, logger }) => {
  data.userConfig.oauth.enabled = true;
  api.on({ linkOAuthAccount: () => ({ status: 400, json: { message: 'Bad request', statusCode: 400 } }) });
  const path = location.pathname;
  history.replaceState({}, '', '?code=oauth-code&state=oauth-state');

  try {
    await router.goto(Route.userSettings());
    await render(Page, load);
    await settle();

    expect(api.linkOAuthAccount).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(/handleError/);
    expect(router.url.searchParams.get(QueryParameter.IS_OPEN)).toBe(OpenQueryParam.OAUTH);
  } finally {
    history.replaceState({}, '', path);
  }
});

test('keeps the OAuth account linked when unlinking fails', async ({
  data,
  router,
  render,
  settle,
  api,
  app,
  logger,
}) => {
  data.user.oauthId = 'oauth-user';
  data.userConfig.oauth.enabled = true;
  api.on({ unlinkOAuthAccount: () => ({ status: 400, json: { message: 'Bad request', statusCode: 400 } }) });
  await router.goto(Route.userSettings({ isOpen: OpenQueryParam.OAUTH }));
  await render(Page, load);

  await app.settings.unlinkOauthButton.click();
  await settle();

  expect(api.unlinkOAuthAccount).toHaveBeenCalled();
  expect(logger.error).toHaveBeenCalledWith(/handleError/);
  await expect.element(app.settings.unlinkOauthButton).toBeVisible();
});
