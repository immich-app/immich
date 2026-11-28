import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import type { App } from '#test/medium/app.ts';
import { expect, test } from '#test/medium/fixtures.ts';

const paletteSelections = [
  { name: 'clicking', select: (app: App) => app.commandPalette.item('delete').click() },
  { name: 'shift-clicking', select: (app: App) => app.commandPalette.item('delete').click({ modifiers: ['Shift'] }) },
  { name: 'Enter on', select: (app: App) => app.commandPalette.pressEnterOn('delete') },
];

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
    await expect(app.viewer.deleteButton).toBeVisible();
    await expect(app.viewer.permanentlyDeleteButton).toHaveCount(0);
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], force: false } });
    expect(api.restoreAssets).toHaveBeenCalledWith({ body: { ids: [asset.id] } });
    expect(api.getAssetInfo).toHaveBeenCalledWith({ params: { id: asset.id } });
  });

  test('Delete moves the asset to the trash', async ({ page, data, api, app }) => {
    const [asset, next] = data.addTimeline({ years: 1 });
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);
    await expect(app.viewer.nextButton).toBeVisible();

    await page.keyboard.press('Delete');

    await app.viewer.waitForAsset(next);
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], force: false } });
  });

  test('Shift+Delete permanently deletes after confirmation', async ({ page, data, api, app }) => {
    const [asset, next] = data.addTimeline({ years: 1 });
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);

    await page.keyboard.press('Shift+Delete');
    await app.dialogButton('delete').click();

    await app.viewer.waitForAsset(next);
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], force: true } });
  });

  test('cancelling the Shift+Delete confirmation keeps the asset', async ({ page, data, api, app }) => {
    const [asset] = data.addTimeline({ years: 1 });
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);

    await page.keyboard.press('Shift+Delete');
    await app.dialogButton('cancel').click();

    await expect(app.dialog).toBeHidden();
    await app.viewer.waitForAsset(asset);
    await expect(page).toHaveURL(Route.viewAsset({ id: asset.id }));
    expect(api.deleteAssets).not.toHaveBeenCalled();
  });

  test('with trash disabled Delete permanently deletes after confirmation', async ({ page, data, api, app }) => {
    data.serverFeatures.trash = false;
    const [asset, next] = data.addTimeline({ years: 1 });
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);
    await expect(app.viewer.permanentlyDeleteButton).toBeVisible();
    await expect(app.viewer.deleteButton).toHaveCount(0);

    await page.keyboard.press('Delete');
    await app.dialogButton('delete').click();

    await app.viewer.waitForAsset(next);
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], force: true } });
  });

  test('do not show again skips the next permanent delete confirmation', async ({ page, data, api, app }) => {
    const [first, second, third] = data.addTimeline({ years: 1 });
    await page.goto(Route.viewAsset({ id: first.id }));
    await app.viewer.waitForAsset(first);
    await page.keyboard.press('Shift+Delete');
    await app.dialogCheckbox('do_not_show_again').check();
    await app.dialogButton('delete').click();
    await app.viewer.waitForAsset(second);

    await page.keyboard.press('Shift+Delete');

    await app.viewer.waitForAsset(third);
    await expect(app.dialog).toHaveCount(0);
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [first.id], force: true } });
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [second.id], force: true } });
  });

  test('undo after trashing the last asset reopens it in the viewer', async ({ page, data, api, app }) => {
    const asset = factory.asset();
    data.addAssets(asset);
    await page.goto(Route.photos());
    await app.timeline.thumbnail(asset).click();
    await app.viewer.waitForAsset(asset);
    await app.viewer.deleteButton.click();
    await expect(app.viewer.root).toHaveCount(0);

    await app.undoButton.click();

    await app.viewer.waitForAsset(asset);
    await expect(page).toHaveURL(Route.viewAsset({ id: asset.id }));
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], force: false } });
    expect(api.restoreAssets).toHaveBeenCalledWith({ body: { ids: [asset.id] } });
  });

  for (const { name, select } of paletteSelections) {
    test(`${name} the delete command palette item trashes the asset`, async ({ page, data, api, app }) => {
      const [asset, next] = data.addTimeline({ years: 1 });
      await page.goto(Route.viewAsset({ id: asset.id }));
      await app.viewer.waitForAsset(asset);
      await app.commandPalette.open();
      await app.commandPalette.search('delete');
      await expect(app.commandPalette.item('delete')).toBeVisible();

      await select(app);

      await app.viewer.waitForAsset(next);
      expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], force: false } });
    });
  }

  test('Delete does nothing while the lock confirmation is open', async ({ page, data, api, app }) => {
    const [asset] = data.addTimeline({ years: 1 });
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);
    await app.viewer.moreButton.click();
    await app.viewer.menuItem('move_to_locked_folder').click();
    await expect(app.dialog).toBeVisible();

    await page.keyboard.press('Delete');

    await app.dialogButton('cancel').click();
    await app.viewer.waitForAsset(asset);
    expect(api.deleteAssets).not.toHaveBeenCalled();
    expect(api.updateAssets).not.toHaveBeenCalled();
  });
});
