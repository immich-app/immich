import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test('slideshow ignores the favorite shortcut and exits by key or button', async ({ page, data, api, app }) => {
  const asset = factory.asset();
  data.addAssets(asset);
  await page.goto(Route.viewAsset({ id: asset.id }));
  await app.viewer.waitForAsset(asset);

  await app.viewer.openSlideshow();
  await expect(app.viewer.exitSlideshowButton).toBeVisible();

  await page.keyboard.press('f');
  await expect(app.toast('added_to_favorites')).not.toBeVisible();
  expect(api.updateAsset).not.toHaveBeenCalled();

  await page.keyboard.press('Escape');
  await expect(app.viewer.exitSlideshowButton).not.toBeVisible();

  await app.viewer.openSlideshow();
  await app.viewer.exitSlideshowButton.click();
  await expect(app.viewer.exitSlideshowButton).not.toBeVisible();
});
