import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test('a failed location save shows an error and keeps the selection', async ({ page, data, api, logger, app }) => {
  const located = factory.asset({ exifInfo: { latitude: 48.85, longitude: 2.35 } });
  const missing = factory.asset();
  data.addAssets([located, missing]);
  api.on({ updateAssets: () => ({ status: 500, json: { message: 'Server error', statusCode: 500 } }) });
  await page.goto(Route.geolocationUtility());
  await app.geolocation.thumbnail(located).click();
  await app.geolocation.thumbnail(missing).click();
  await app.geolocation.applyButton.click();

  await app.dialogButton('confirm').click();

  await expect(app.toast(/Server error/)).toBeVisible();
  await expect(app.geolocation.unselectAllButton).toBeEnabled();
  expect(logger.error).toHaveBeenCalledWith(/500/);
  expect(api.updateAssets).toHaveBeenCalledWith({
    body: { ids: [missing.id], latitude: 48.85, longitude: 2.35 },
  });
});
