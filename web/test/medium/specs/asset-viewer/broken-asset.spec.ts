import { Route } from '#lib/route.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { factory } from '#test/medium/mock/factories.ts';

test.describe('broken asset', () => {
  test('stack strip shows a compact message without an icon', async ({ page, data, logger, app }) => {
    const [primary, ...broken] = [factory.asset(), factory.asset(), factory.asset(), factory.asset()];
    data.addStack(factory.stack({ assets: [primary, ...broken] })).markBroken(...broken);
    await page.goto(Route.viewAsset({ id: primary.id }));
    await app.viewer.waitForAsset(primary);

    const brokenAssets = app.viewer.stack.locator('[data-broken-asset]');
    await expect(brokenAssets).toHaveCount(broken.length);
    for (const brokenAsset of await brokenAssets.all()) {
      await expect(brokenAsset).toBeVisible();
      await expect(brokenAsset.locator('svg')).not.toBeVisible();
      await expect(brokenAsset.locator('span')).toHaveClass(/text-xs/);
    }
    expect(logger.error).toHaveBeenCalledWith(/404/);
  });

  test('main viewer shows the icon and the base text size', async ({ page, data, logger, app }) => {
    const asset = factory.asset();
    data.addAsset(asset).markBroken(asset);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await expect(app.viewer.root).toBeVisible();

    const brokenAsset = app.viewer.content.locator('[data-broken-asset]').first();
    await expect(brokenAsset).toBeVisible();
    await expect(brokenAsset.locator('svg')).toBeVisible();
    await expect(brokenAsset.locator('span')).toHaveClass(/text-base/);
    expect(logger.error).toHaveBeenCalledWith(/404/);
  });
});
