import { Route } from '#lib/route.ts';
import type { MockData } from '#test/common/data.ts';
import { editedThumbhash, factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import type { MockNetwork } from '#test/medium/mocks/api.ts';
import { AssetEditAction, AssetVisibility } from '@immich/sdk';

const query = encodeURIComponent(JSON.stringify({ originalFileName: 'test' }));
const searchAssetUrl = (asset: { id: string }) => `/search/photos/${asset.id}?query=${query}`;

const setup = () =>
  Array.from({ length: 5 }, (_, index) =>
    factory.asset({ fileCreatedAt: `2025-06-${String(20 - index).padStart(2, '0')}T12:00:00.000Z` }),
  );

const remoteChanges = [
  { name: 'trashed', emit: (api: MockNetwork, _: MockData, id: string) => api.emit('on_asset_trash', [id]) },
  { name: 'deleted', emit: (api: MockNetwork, _: MockData, id: string) => api.emit('on_asset_delete', id) },
  {
    name: 'archived',
    emit: (api: MockNetwork, data: MockData, id: string) =>
      api.emit('on_asset_update', data.updateAssets({ ids: [id], visibility: AssetVisibility.Archive }).getAsset(id)),
  },
];

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

  test('delete key trashes the selected results', async ({ page, data, api, app }) => {
    const [asset, other] = setup();
    data.addAssets([asset, other]);
    await page.goto(Route.search({ originalFileName: 'test' }));
    await app.timeline.select(asset);

    await page.keyboard.press('Delete');

    await expect(app.timeline.thumbnail(asset)).toHaveCount(0);
    await expect(app.timeline.thumbnail(other)).toBeVisible();
    expect(api.searchAssets).toHaveBeenCalledWith({ body: expect.objectContaining({ originalFileName: 'test' }) });
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], force: false } });
  });

  test('archiving advances to the next result and drops it from the grid', async ({ page, data, api, app }) => {
    const [archived, next] = setup();
    data.addAssets([archived, next]);
    await page.goto(searchAssetUrl(archived));
    await app.viewer.waitForAsset(archived);

    await app.viewer.archive();

    await app.viewer.waitForAsset(next);
    await app.viewer.backButton.click();
    await expect(app.timeline.thumbnail(next)).toBeVisible();
    await expect(app.timeline.thumbnail(archived)).toHaveCount(0);
    expect(api.updateAsset).toHaveBeenCalledWith({
      params: { id: archived.id },
      body: { visibility: AssetVisibility.Archive },
    });
  });

  test('archiving the only result closes the viewer on the search page', async ({ page, data, api, app }) => {
    const [asset] = setup();
    data.addAssets(asset);
    const searchUrl = Route.search({ originalFileName: 'test' });
    await page.goto(searchUrl);
    await app.timeline.thumbnail(asset).click();
    await app.viewer.waitForAsset(asset);

    await app.viewer.archive();

    await expect(page).toHaveURL(searchUrl);
    await expect(app.viewer.root).toHaveCount(0);
    expect(api.searchAssets).toHaveBeenCalledWith({ body: expect.objectContaining({ originalFileName: 'test' }) });
    expect(api.updateAsset).toHaveBeenCalledWith({
      params: { id: asset.id },
      body: { visibility: AssetVisibility.Archive },
    });
  });

  for (const { name, emit } of remoteChanges) {
    test(`drops the open result ${name} on another device`, async ({ page, data, api, app }) => {
      const [asset, next] = setup();
      data.addAssets([asset, next]);
      await page.goto(searchAssetUrl(asset));
      await app.viewer.waitForAsset(asset);

      emit(api, data, asset.id);

      await app.viewer.waitForAsset(next);
      await app.viewer.backButton.click();
      await expect(app.timeline.thumbnail(next)).toBeVisible();
      await expect(app.timeline.thumbnail(asset)).toHaveCount(0);
    });

    test(`keeps the open result when another is ${name} on another device`, async ({ page, data, api, app }) => {
      const [asset, other] = setup();
      data.addAssets([asset, other]);
      await page.goto(searchAssetUrl(asset));
      await app.viewer.waitForAsset(asset);

      emit(api, data, other.id);

      await app.viewer.waitForAsset(asset);
      await app.viewer.backButton.click();
      await expect(app.timeline.thumbnail(asset)).toBeVisible();
    });
  }
});
