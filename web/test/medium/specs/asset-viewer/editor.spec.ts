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
});
