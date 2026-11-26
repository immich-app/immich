import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import type { App } from '#test/medium/app.ts';
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

  test('shows the saved edits when reopening the editor', async ({ page, data, api, app }) => {
    const asset = factory.asset();
    data.addAssets(asset);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);
    await app.viewer.editor.openButton.click();
    await app.viewer.editor.rotateRightButton.click();
    await app.viewer.editor.saveButton.click();
    await expect.poll(() => api.editAsset.calls).toHaveLength(1);
    api.emit('AssetEditReadyV2', { asset: { id: asset.id }, edit: [] });
    await expect(app.viewer.editor.saveButton).toHaveCount(0);

    await app.viewer.editor.openButton.click();

    await expect(app.viewer.editor.resetButton).toBeEnabled();
    expect(api.getAssetEdits.calls).toHaveLength(2);
    expect(api.editAsset).toHaveBeenCalledWith({
      params: { id: asset.id },
      body: { edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }] },
    });
  });

  test('shows no edits when reopening the editor after a reset', async ({ page, data, api, app }) => {
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
    await expect(app.viewer.editor.saveButton).toHaveCount(0);

    await app.viewer.editor.openButton.click();

    await expect(app.viewer.editor.rotateRightButton).toBeVisible();
    await expect(app.viewer.editor.resetButton).toBeDisabled();
    expect(api.removeAssetEdits).toHaveBeenCalledWith({ params: { id: asset.id } });
  });

  test('shows no edits for the next asset after editing one', async ({ page, data, app }) => {
    const first = factory.asset({ fileCreatedAt: '2025-06-02T12:00:00.000Z' });
    const second = factory.asset({ fileCreatedAt: '2025-05-01T12:00:00.000Z' });
    data.addAssets([first, second]);
    data.editAsset(first.id, { edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }] });
    await page.goto(Route.viewAsset({ id: first.id }));
    await app.viewer.waitForAsset(first);
    await app.viewer.editor.openButton.click();
    await expect(app.viewer.editor.resetButton).toBeEnabled();
    await app.viewer.editor.closeButton.click();
    await expect(app.viewer.editor.saveButton).toHaveCount(0);
    await app.viewer.nextButton.click();
    await app.viewer.waitForAsset(second);

    await app.viewer.editor.openButton.click();

    await expect(app.viewer.editor.rotateRightButton).toBeVisible();
    await expect(app.viewer.editor.resetButton).toBeDisabled();
  });

  const saveFailures = [
    {
      name: 'editing',
      operation: 'editAsset',
      edits: [],
      change: (app: App) => app.viewer.editor.rotateRightButton.click(),
      request: (id: string) => ({
        params: { id },
        body: { edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }] },
      }),
    },
    {
      name: 'removing edits',
      operation: 'removeAssetEdits',
      edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }],
      change: (app: App) => app.viewer.editor.resetButton.click(),
      request: (id: string) => ({ params: { id } }),
    },
  ] as const;

  for (const { name, operation, edits, change, request } of saveFailures) {
    test(`shows an error when ${name} fails`, async ({ page, data, api, logger, app }) => {
      const asset = factory.asset();
      data.addAssets(asset);
      if (edits.length > 0) {
        data.editAsset(asset.id, { edits: [...edits] });
      }
      api.on({ [operation]: () => ({ status: 500, json: { message: 'Server error', statusCode: 500 } }) });
      await page.goto(Route.viewAsset({ id: asset.id }));
      await app.viewer.waitForAsset(asset);
      await app.viewer.editor.openButton.click();
      await change(app);

      await app.viewer.editor.saveButton.click();

      await expect(app.toast('editor_edits_applied_error')).toBeVisible();
      await expect(app.viewer.editor.saveButton).toBeVisible();
      expect(api[operation]).toHaveBeenCalledWith(request(asset.id));
      expect(logger.error).toHaveBeenCalledWith(/status of 500/);
    });
  }
});
