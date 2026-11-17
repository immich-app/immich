import { OpenQueryParam } from '#lib/constants.ts';
import { Route } from '#lib/route.ts';
import { expect, test } from '#test/medium/fixtures.ts';

const individualKey = 'IMCL-AAAA-BBBB-CCCC-DDDD-EEEE-FFFF-GGGG-HHHH';
const serverKey = 'IMSV-AAAA-BBBB-CCCC-DDDD-EEEE-FFFF-GGGG-HHHH';
const purchaseSettings = Route.userSettings({ isOpen: OpenQueryParam.PURCHASE_SETTINGS });

test('activates an individual product key', async ({ page, data, api, app }) => {
  data.addActivationKey(individualKey, 'activation-key');
  await page.goto(purchaseSettings);

  await app.settings.purchase.productKeyInput.fill(individualKey);
  await app.settings.purchase.activateButton.click();

  await expect(app.settings.purchase.title('purchase_individual_title')).toBeVisible();
  await expect(app.settings.purchase.removeKeyButton).toBeVisible();
  expect(api.setUserLicense).toHaveBeenCalledWith({
    body: { licenseKey: individualKey, activationKey: 'activation-key' },
  });
  expect(api.setServerLicense).not.toHaveBeenCalled();
});

test('activates a server product key as an admin', async ({ page, data, api, app }) => {
  data.addActivationKey(serverKey, 'activation-key');
  await page.goto(purchaseSettings);

  await app.settings.purchase.productKeyInput.fill(serverKey);
  await app.settings.purchase.activateButton.click();

  await expect(app.settings.purchase.title('purchase_server_title')).toBeVisible();
  await expect(app.settings.purchase.removeKeyButton).toBeVisible();
  await expect(app.settings.purchase.productKeyInput).toBeHidden();
  expect(api.setServerLicense).toHaveBeenCalledWith({
    body: { licenseKey: serverKey, activationKey: 'activation-key' },
  });
  expect(api.setUserLicense).not.toHaveBeenCalled();
});

test('activates a server product key for a non-admin user', async ({ page, data, api, app }) => {
  data.user.isAdmin = false;
  data.addActivationKey(serverKey, 'activation-key');
  await page.goto(purchaseSettings);

  await app.settings.purchase.productKeyInput.fill(serverKey);
  await app.settings.purchase.activateButton.click();

  await expect(app.settings.purchase.title('purchase_individual_title')).toBeVisible();
  await expect(app.settings.purchase.removeKeyButton).toBeVisible();
  expect(api.setUserLicense).toHaveBeenCalledWith({ body: { licenseKey: serverKey, activationKey: 'activation-key' } });
  expect(api.setServerLicense).not.toHaveBeenCalled();
});

test('shows an error for an unknown product key', async ({ page, api, app, logger }) => {
  await page.goto(purchaseSettings);

  await app.settings.purchase.productKeyInput.fill(individualKey);
  await app.settings.purchase.activateButton.click();

  await expect(app.toast('purchase_failed_activation')).toBeVisible();
  await expect(app.settings.purchase.productKeyInput).toHaveValue(individualKey);
  expect(logger.error).toHaveBeenCalledWith(/handleError/);
  expect(logger.error).toHaveBeenCalledWith(/status of 404/);
  expect(api.setUserLicense).not.toHaveBeenCalled();
});

test('shows an error for a product key the server rejects', async ({ page, data, api, app, logger }) => {
  data.addActivationKey(individualKey, 'activation-key');
  api.on({ setUserLicense: () => ({ status: 400, json: { message: 'Invalid license key', statusCode: 400 } }) });
  await page.goto(purchaseSettings);

  await app.settings.purchase.productKeyInput.fill(individualKey);
  await app.settings.purchase.activateButton.click();

  await expect(app.toast(/Invalid license key/)).toBeVisible();
  await expect(app.settings.purchase.productKeyInput).toHaveValue(individualKey);
  expect(logger.error).toHaveBeenCalledWith(/handleError/);
  expect(logger.error).toHaveBeenCalledWith(/status of 400/);
  expect(api.setUserLicense).toHaveBeenCalledWith({
    body: { licenseKey: individualKey, activationKey: 'activation-key' },
  });
});
