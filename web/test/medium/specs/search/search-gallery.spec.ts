import { Route } from '#lib/route.ts';
import { editedThumbhash, factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { AssetEditAction } from '@immich/sdk';

const query = encodeURIComponent(JSON.stringify({ originalFileName: 'test' }));
const searchAssetUrl = (asset: { id: string }) => `/search/photos/${asset.id}?query=${query}`;

const setup = () =>
  Array.from({ length: 5 }, (_, index) =>
    factory.asset({ fileCreatedAt: `2025-06-${String(20 - index).padStart(2, '0')}T12:00:00.000Z` }),
  );

test.describe('search gallery viewer', () => {
  test('deleting advances to the next result', async ({ page, data, api, app }) => {
    const assets = setup();
    data.addAssets(assets);
    await page.goto(searchAssetUrl(assets[0]));
    await app.viewer.waitForAsset(assets[0]);
    expect(api.searchAssets).toHaveBeenCalledWith({
      body: expect.objectContaining({ originalFileName: 'test' }),
    });

    await app.viewer.deleteButton.click();
    await app.viewer.waitForAsset(assets[1]);
    await app.viewer.deleteButton.click();
    await app.viewer.waitForAsset(assets[2]);

    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [assets[0].id], force: false } });
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [assets[1].id], force: false } });
  });

  test('deleting keeps the position and the last result falls back', async ({ page, data, api, app }) => {
    const assets = setup();
    data.addAssets(assets);
    await page.goto(searchAssetUrl(assets[1]));
    await app.viewer.waitForAsset(assets[1]);

    await app.viewer.previousButton.click();
    await app.viewer.waitForAsset(assets[0]);
    await app.viewer.nextButton.click();
    await app.viewer.waitForAsset(assets[1]);
    await app.viewer.deleteButton.click();
    await app.viewer.waitForAsset(assets[2]);

    await app.viewer.nextButton.click();
    await app.viewer.waitForAsset(assets[3]);
    await app.viewer.nextButton.click();
    await app.viewer.waitForAsset(assets[4]);
    await expect(app.viewer.nextButton).toHaveCount(0);

    await app.viewer.deleteButton.click();
    await app.viewer.waitForAsset(assets[3]);
    await expect(app.viewer.previousButton).toBeVisible();

    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [assets[1].id], force: false } });
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [assets[4].id], force: false } });
  });

  test('deleting in the viewer removes the result from the grid', async ({ page, data, api, app }) => {
    const [deleted, next] = setup();
    data.addAssets([deleted, next]);
    await page.goto(searchAssetUrl(deleted));
    await app.viewer.waitForAsset(deleted);

    await app.viewer.deleteButton.click();
    await app.viewer.waitForAsset(next);
    await app.viewer.backButton.click();

    await expect(app.timeline.thumbnail(next)).toBeVisible();
    await expect(app.timeline.thumbnail(deleted)).toHaveCount(0);
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [deleted.id], force: false } });
  });

  test('editing in the viewer refreshes the result thumbnail', async ({ page, data, api, app }) => {
    const [asset] = setup();
    data.addAssets(asset);
    await page.goto(searchAssetUrl(asset));
    await app.viewer.waitForAsset(asset);
    await app.viewer.editor.openButton.click();
    await app.viewer.editor.rotateRightButton.click();

    await app.viewer.editor.saveButton.click();
    await expect.poll(() => api.editAsset.calls).toHaveLength(1);
    api.emit('AssetEditReadyV2', { asset: { id: asset.id }, edit: [] });
    await expect(app.toast('editor_edits_applied_success')).toBeVisible();
    await app.viewer.backButton.click();

    await expect(app.timeline.thumbnailImage(asset)).toHaveAttribute(
      'src',
      new RegExp(encodeURIComponent(editedThumbhash)),
    );
    expect(api.editAsset).toHaveBeenCalledWith({
      params: { id: asset.id },
      body: { edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }] },
    });
  });

  test('trashing the only result closes the viewer on the search page', async ({ page, data, api, app }) => {
    const [asset] = setup();
    data.addAssets(asset);
    const searchUrl = Route.search({ originalFileName: 'test' });
    await page.goto(searchUrl);
    await app.timeline.thumbnail(asset).click();
    await app.viewer.waitForAsset(asset);

    await app.viewer.deleteButton.click();

    await expect(page).toHaveURL(searchUrl);
    await expect(app.viewer.root).toHaveCount(0);
    expect(api.searchAssets).toHaveBeenCalledWith({ body: expect.objectContaining({ originalFileName: 'test' }) });
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], force: false } });
  });
});
