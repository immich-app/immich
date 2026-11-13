import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test('a postponed buy button stays hidden after a reload', async ({ page, data, api, app }) => {
  data.user.createdAt = '2020-01-01T00:00:00.000Z';
  data.setPreferences(
    factory.preferences({ purchase: { hideBuyButtonUntil: '2020-01-01T00:00:00.000Z', showSupportBadge: false } }),
  );
  await page.goto(Route.albums());

  await app.sidebar.purchaseInfo.buyButton.hover();
  await app.sidebar.purchaseInfo.remindMeButton.click();

  await expect(app.sidebar.purchaseInfo.buyButton).toBeHidden();
  expect(api.updateMyPreferences).toHaveBeenCalledWith({
    body: { purchase: { hideBuyButtonUntil: expect.any(String) } },
  });
  await page.reload();
  await expect(app.albums.createAlbumButton).toBeVisible();
  await expect(app.sidebar.purchaseInfo.buyButton).toBeHidden();
});
