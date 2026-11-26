import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test.describe('asset viewer navigation', () => {
  test.describe('/photos/:id', () => {
    test('moves between assets with buttons and arrow keys', async ({ page, data, app }) => {
      const assets = data.addTimeline({ years: 1 });
      await page.goto(Route.viewAsset({ id: assets[40].id }));
      await app.viewer.waitForAsset(assets[40]);

      await app.viewer.nextButton.click();
      await app.viewer.waitForAsset(assets[41]);
      await expect(page).toHaveURL(Route.viewAsset({ id: assets[41].id }));
      await app.viewer.previousButton.click();
      await app.viewer.waitForAsset(assets[40]);

      await page.keyboard.press('ArrowRight');
      await app.viewer.waitForAsset(assets[41]);
      await page.keyboard.press('ArrowLeft');
      await app.viewer.waitForAsset(assets[40]);

      for (let step = 1; step <= 5; step++) {
        await app.viewer.nextButton.click();
        await app.viewer.waitForAsset(assets[40 + step]);
      }
      for (let step = 4; step >= 0; step--) {
        await app.viewer.previousButton.click();
        await app.viewer.waitForAsset(assets[40 + step]);
      }
      await expect(page).toHaveURL(Route.viewAsset({ id: assets[40].id }));
    });

    test('hides the navigation button at either end', async ({ page, data, app }) => {
      const assets = data.addTimeline({ years: 1 });

      await page.goto(Route.viewAsset({ id: assets[0].id }));
      await app.viewer.waitForAsset(assets[0]);
      await expect(app.viewer.nextButton).toBeVisible();
      await expect(app.viewer.previousButton).toHaveCount(0);

      await page.goto(Route.viewAsset({ id: assets.at(-1)!.id }));
      await app.viewer.waitForAsset(assets.at(-1)!);
      await expect(app.viewer.previousButton).toBeVisible();
      await expect(app.viewer.nextButton).toHaveCount(0);
    });

    test('hides the next button when the next asset is trashed on another device', async ({ page, data, api, app }) => {
      const asset = factory.asset({ fileCreatedAt: '2025-06-02T12:00:00.000Z' });
      const next = factory.asset({ fileCreatedAt: '2025-05-01T12:00:00.000Z' });
      data.addAssets([asset, next]);
      await page.goto(Route.viewAsset({ id: asset.id }));
      await app.viewer.waitForAsset(asset);
      await expect(app.viewer.nextButton).toBeVisible();
      data.deleteAssets([next.id]);

      api.emit('on_asset_trash', [next.id]);

      await expect(app.viewer.nextButton).toHaveCount(0);
    });

    test('shows the previous button when a newer asset is uploaded on another device', async ({
      page,
      data,
      api,
      app,
    }) => {
      const asset = factory.asset({ fileCreatedAt: '2025-06-02T12:00:00.000Z' });
      const next = factory.asset({ fileCreatedAt: '2025-05-01T12:00:00.000Z' });
      const uploaded = factory.asset({ fileCreatedAt: '2025-07-01T12:00:00.000Z' });
      data.addAssets([asset, next]);
      await page.goto(Route.viewAsset({ id: asset.id }));
      await app.viewer.waitForAsset(asset);
      await expect(app.viewer.nextButton).toBeVisible();
      data.addAssets(uploaded);

      api.emit('on_upload_success', uploaded);

      await app.viewer.previousButton.click();
      await app.viewer.waitForAsset(uploaded);
    });

    test('delete advances to the next asset', async ({ page, data, api, app }) => {
      const assets = data.addTimeline({ years: 1 });
      await page.goto(Route.viewAsset({ id: assets[40].id }));
      await app.viewer.waitForAsset(assets[40]);

      await app.viewer.deleteButton.click();
      await app.viewer.waitForAsset(assets[41]);
      await app.viewer.deleteButton.click();
      await app.viewer.waitForAsset(assets[42]);

      expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [assets[40].id], force: false } });
      expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [assets[41].id], force: false } });
    });

    test('Delete pressed twice in a row keeps the viewer open', async ({ page, data, api, app }) => {
      const assets = data.addTimeline({ years: 1 });
      await page.goto(Route.viewAsset({ id: assets[40].id }));
      await app.viewer.waitForAsset(assets[40]);
      await expect(app.viewer.nextButton).toBeVisible();

      await page.keyboard.press('Delete');
      await page.keyboard.press('Delete');

      await expect.poll(() => api.deleteAssets.calls.length).toBe(2);
      await app.viewer.waitForAsset(assets[41]);
      await expect(page).toHaveURL(Route.viewAsset({ id: assets[41].id }));
      expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [assets[40].id], force: false } });
    });

    test('delete at the end goes back to the previous asset', async ({ page, data, api, app }) => {
      const assets = data.addTimeline({ years: 1 });
      await page.goto(Route.viewAsset({ id: assets.at(-1)!.id }));
      await app.viewer.waitForAsset(assets.at(-1)!);

      await app.viewer.deleteButton.click();
      await app.viewer.waitForAsset(assets.at(-2)!);
      await app.viewer.deleteButton.click();
      await app.viewer.waitForAsset(assets.at(-3)!);

      expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [assets.at(-1)!.id], force: false } });
      expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [assets.at(-2)!.id], force: false } });
    });
  });

  test.describe('/trash/photos/:id', () => {
    test('permanently delete advances to the next asset', async ({ page, data, api, app }) => {
      const trashed = data.addTimeline({ years: 1 }).slice(100, 120);
      data.deleteAssets(trashed.map(({ id }) => id));
      await page.goto(Route.viewTrashedAsset({ id: trashed[10].id }));
      await app.viewer.waitForAsset(trashed[10]);

      await app.viewer.permanentlyDelete();
      await app.viewer.waitForAsset(trashed[11]);
      await app.viewer.permanentlyDelete();
      await app.viewer.waitForAsset(trashed[12]);

      expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [trashed[10].id], force: true } });
      expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [trashed[11].id], force: true } });
    });

    test('permanently delete at the end goes back to the previous asset', async ({ page, data, api, app }) => {
      const trashed = data.addTimeline({ years: 1 }).slice(100, 120);
      data.deleteAssets(trashed.map(({ id }) => id));
      await page.goto(Route.viewTrashedAsset({ id: trashed[19].id }));
      await app.viewer.waitForAsset(trashed[19]);

      await app.viewer.permanentlyDelete();
      await app.viewer.waitForAsset(trashed[18]);
      await app.viewer.permanentlyDelete();
      await app.viewer.waitForAsset(trashed[17]);

      expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [trashed[19].id], force: true } });
      expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [trashed[18].id], force: true } });
    });
  });

  test('a link to a missing asset shows the error page', async ({ page, api, logger, app }) => {
    const id = crypto.randomUUID();

    await page.goto(Route.viewAsset({ id }));

    await expect(app.errorPage.title).toBeVisible();
    await expect(app.viewer.root).toHaveCount(0);
    expect(api.getAssetInfo).toHaveBeenCalledWith({ params: expect.objectContaining({ id }) });
    expect(logger.error).toHaveBeenCalledWith(/404/);
  });

  test('opening an asset from the timeline loads it once', async ({ page, data, api, app }) => {
    const [asset] = data.addTimeline({ years: 1 });
    await page.goto(Route.photos());

    await app.timeline.thumbnail(asset).click();

    await app.viewer.waitForAsset(asset);
    await app.viewer.openDetailPanel();
    const calls = api.getAssetInfo.calls.filter((call) => call.params.id === asset.id);
    expect(calls).toHaveLength(1);
  });
});
