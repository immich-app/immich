import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test.describe('folders', () => {
  test('trashing the only asset in a folder closes the viewer on the folder', async ({ page, data, api, app }) => {
    const asset = factory.asset({ originalPath: '/library/trip/beach.jpg', originalFileName: 'beach.jpg' });
    data.addAssets(asset);
    const folderUrl = Route.folders({ path: '/library/trip' });
    await page.goto(folderUrl);
    await app.timeline.thumbnail(asset).click();
    await app.viewer.waitForAsset(asset);

    await app.viewer.deleteButton.click();

    await expect(page).toHaveURL(folderUrl);
    await expect(app.viewer.root).toHaveCount(0);
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], force: false } });
  });

  test('trashing an asset from the viewer removes it from the folder', async ({ page, data, api, app }) => {
    const asset = factory.asset({ originalPath: '/library/trip/a.jpg', originalFileName: 'a.jpg' });
    const next = factory.asset({ originalPath: '/library/trip/b.jpg', originalFileName: 'b.jpg' });
    data.addAssets([asset, next]);
    await page.goto(Route.folders({ path: '/library/trip' }));
    await app.timeline.thumbnail(asset).click();
    await app.viewer.waitForAsset(asset);

    await app.viewer.deleteButton.click();
    await app.viewer.waitForAsset(next);
    await app.viewer.backButton.click();

    await expect(app.timeline.thumbnail(next)).toBeVisible();
    await expect(app.timeline.thumbnail(asset)).toHaveCount(0);
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], force: false } });
  });
});
