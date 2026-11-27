import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test('opens the asset of a marker in the viewer', async ({ page, data, api, app }) => {
  const asset = factory.asset({ exifInfo: { latitude: 38.97, longitude: -109.71 } });
  data.addAssets(asset);
  await page.goto(Route.map());

  await app.map.markers.first().click({ force: true });

  await app.viewer.waitForAsset(asset);
  expect(api.getAssetInfo).toHaveBeenCalledWith({ params: { id: asset.id } });
});
