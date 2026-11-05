import { Route } from '#lib/route.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test('favorite and unfavorite an asset from the viewer by button and shortcut', async ({ page, data, api, app }) => {
  const [asset] = data.addTimeline({ years: 1 });
  await page.goto(Route.photos());

  await app.timeline.thumbnail(asset).click();
  await app.viewer.waitForAsset(asset);
  await app.viewer.favoriteButton.click();
  await expect(app.viewer.unfavoriteButton).toBeVisible();
  await expect(page.getByText('added_to_favorites')).toBeVisible();

  await app.viewer.unfavoriteButton.click();
  await expect(app.viewer.favoriteButton).toBeVisible();

  await page.keyboard.press('f');
  await expect(app.viewer.unfavoriteButton).toBeVisible();

  expect(api.updateAsset).toHaveBeenCalledWith({ params: { id: asset.id }, body: { isFavorite: true } });
  expect(api.updateAsset).toHaveBeenCalledWith({ params: { id: asset.id }, body: { isFavorite: false } });
});
