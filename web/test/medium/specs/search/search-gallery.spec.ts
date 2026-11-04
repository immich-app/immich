import { expect, test } from '#test/medium/fixtures.ts';
import { factory } from '#test/medium/mock/factories.ts';

const query = encodeURIComponent(JSON.stringify({ originalFileName: 'test' }));
const searchAssetUrl = (asset: { id: string }) => `/search/photos/${asset.id}?query=${query}`;

const setup = () =>
  Array.from({ length: 5 }, (_, index) =>
    factory.asset({ fileCreatedAt: `2025-06-${String(20 - index).padStart(2, '0')}T12:00:00.000Z` }),
  );

test.describe('search gallery viewer', () => {
  test('deleting advances to the next result', async ({ page, data, api, app }) => {
    const assets = setup();
    data.addAssets(...assets);
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

  test('navigating then deleting keeps the position, and the last result falls back to the previous', async ({
    page,
    data,
    api,
    app,
  }) => {
    const assets = setup();
    data.addAssets(...assets);
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
});
