import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { AssetEditAction } from '@immich/sdk';

test.describe('editor', () => {
  test('opens with the saved edits of an asset', async ({ page, data, api, app }) => {
    const asset = factory.asset();
    data.addAssets(asset);
    data.editAsset(asset.id, { edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }] });
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);

    await app.viewer.editor.openButton.click();

    await expect(app.viewer.editor.resetButton).toBeEnabled();
    expect(api.getAssetEdits).toHaveBeenCalledWith({ params: { id: asset.id } });
  });

  test('rotates and saves an asset', async ({ page, data, api, app }) => {
    const asset = factory.asset();
    data.addAssets(asset);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);
    await app.viewer.editor.openButton.click();
    await expect(app.viewer.editor.resetButton).toBeDisabled();

    await app.viewer.editor.rotateRightButton.click();
    await app.viewer.editor.saveButton.click();
    await expect.poll(() => api.editAsset.calls).toHaveLength(1);
    api.emit('AssetEditReadyV2', { asset: { id: asset.id }, edit: [] });

    await expect(app.toast('editor_edits_applied_success')).toBeVisible();
    expect(api.editAsset).toHaveBeenCalledWith({
      params: { id: asset.id },
      body: { edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }] },
    });
  });

  test('resets the edits of an asset', async ({ page, data, api, app }) => {
    const asset = factory.asset();
    data.addAssets(asset);
    data.editAsset(asset.id, { edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }] });
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);
    await app.viewer.editor.openButton.click();

    await app.viewer.editor.resetButton.click();
    await app.viewer.editor.saveButton.click();
    await expect.poll(() => api.removeAssetEdits.calls).toHaveLength(1);
    api.emit('AssetEditReadyV2', { asset: { id: asset.id }, edit: [] });

    await expect(app.toast('editor_edits_applied_success')).toBeVisible();
    expect(api.removeAssetEdits).toHaveBeenCalledWith({ params: { id: asset.id } });
  });

  test('shows the refreshed asset after saving', async ({ page, data, api, app }) => {
    const asset = factory.asset({ exifInfo: { exifImageWidth: 4000, exifImageHeight: 3000 } });
    data.addAssets(asset);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);
    await app.viewer.openDetailPanel();
    await expect(app.viewer.detailPanel.getByText('4000 × 3000')).toBeVisible();
    await app.viewer.editor.openButton.click();
    await app.viewer.editor.rotateRightButton.click();

    await app.viewer.editor.saveButton.click();
    await expect.poll(() => api.editAsset.calls).toHaveLength(1);
    data.addAssets({ ...data.getAsset(asset.id)!, exifInfo: { exifImageWidth: 3000, exifImageHeight: 4000 } });
    api.emit('AssetEditReadyV2', { asset: { id: asset.id }, edit: [] });

    await expect(app.viewer.editor.saveButton).toHaveCount(0);
    await app.viewer.openDetailPanel();
    await expect(app.viewer.detailPanel.getByText('3000 × 4000')).toBeVisible();
    expect(api.editAsset).toHaveBeenCalledWith({
      params: { id: asset.id },
      body: { edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }] },
    });
  });

  test('shows an error when saving fails', async ({ page, data, api, logger, app }) => {
    const asset = factory.asset();
    data.addAssets(asset);
    api.on({ editAsset: () => ({ status: 500, json: { message: 'Server error', statusCode: 500 } }) });
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);
    await app.viewer.editor.openButton.click();
    await app.viewer.editor.rotateRightButton.click();

    await app.viewer.editor.saveButton.click();

    await expect(app.toast('editor_edits_applied_error')).toBeVisible();
    await expect(app.viewer.editor.saveButton).toBeVisible();
    expect(api.editAsset).toHaveBeenCalledWith({
      params: { id: asset.id },
      body: { edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }] },
    });
    expect(logger.error).toHaveBeenCalledWith(/status of 500/);
  });
});
