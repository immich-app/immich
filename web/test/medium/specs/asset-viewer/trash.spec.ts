import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test.describe('trash from the viewer', () => {
  test('restores an asset opened from the trash', async ({ page, data, api, app }) => {
    const asset = factory.asset({ isTrashed: true });
    data.addAssets(asset);
    await page.goto(Route.trash());

    await app.timeline.thumbnail(asset).click();
    await app.viewer.waitForAsset(asset);
    await app.viewer.restore();

    await expect(app.toast('restored_asset')).toBeVisible();
    await expect(app.viewer.deleteButton).toBeVisible();
    await expect(app.viewer.permanentlyDeleteButton).toHaveCount(0);
    expect(api.restoreAssets).toHaveBeenCalledWith({ body: { ids: [asset.id] } });
  });

  test('undoes a trash from the toast', async ({ page, data, api, app }) => {
    const [asset, next] = data.addTimeline({ years: 1 });
    await page.goto(Route.photos());

    await app.timeline.thumbnail(asset).click();
    await app.viewer.waitForAsset(asset);
    await app.viewer.deleteButton.click();
    await app.viewer.waitForAsset(next);
    await app.undoButton.click();

    await app.viewer.waitForAsset(asset);
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], force: false } });
    expect(api.restoreAssets).toHaveBeenCalledWith({ body: { ids: [asset.id] } });
    expect(api.getAssetInfo).toHaveBeenCalledWith({ params: { id: asset.id } });
  });
});
