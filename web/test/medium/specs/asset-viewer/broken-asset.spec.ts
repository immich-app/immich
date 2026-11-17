import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test.describe('broken asset', () => {
  test('stack strip shows the message without an icon', async ({ page, data, logger, app }) => {
    const [primary, ...broken] = [factory.asset(), factory.asset(), factory.asset(), factory.asset()];
    data.addStacks(factory.stack({ assets: [primary, ...broken] })).markBroken(broken);
    await page.goto(Route.viewAsset({ id: primary.id }));
    await app.viewer.waitForAsset(primary);

    const brokenAssets = app.viewer.stackBrokenAssets;
    await expect(brokenAssets).toHaveCount(broken.length);
    for (const brokenAsset of await brokenAssets.all()) {
      await expect(brokenAsset.getByText('error_loading_image')).toBeVisible();
      await expect(brokenAsset.getByRole('img', { includeHidden: true })).not.toBeVisible();
    }
    expect(logger.error).toHaveBeenCalledWith(/404/);
  });

  test('main viewer shows the icon and the message', async ({ page, data, logger, app }) => {
    const asset = factory.asset();
    data.addAssets(asset).markBroken(asset);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await expect(app.viewer.root).toBeVisible();

    const brokenAsset = app.viewer.brokenAsset;
    await expect(brokenAsset.getByText('error_loading_image')).toBeVisible();
    await expect(brokenAsset.getByRole('img', { includeHidden: true })).toBeVisible();
    expect(logger.error).toHaveBeenCalledWith(/404/);
  });
});
