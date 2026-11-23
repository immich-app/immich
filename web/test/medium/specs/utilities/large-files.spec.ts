import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

const largeFileUrl = (asset: { id: string }) => `${Route.largeFileUtility()}/photos/${asset.id}`;

const setup = () =>
  [3, 2, 1].map((megabytes) => factory.asset({ exifInfo: { fileSizeInByte: megabytes * 1_000_000 } }));

test('opening a large file puts it in the url', async ({ page, data, app }) => {
  const assets = setup();
  data.addAssets(assets);
  await page.goto(Route.largeFileUtility());

  await app.largeFiles.thumbnail(assets[1]).click();

  await app.viewer.waitForAsset(assets[1]);
  await expect(page).toHaveURL(largeFileUrl(assets[1]));
});

test('deleting advances to the next large file and drops it from the list', async ({ page, data, api, app }) => {
  const [deleted, next, last] = setup();
  data.addAssets([deleted, next, last]);
  await page.goto(largeFileUrl(deleted));
  await app.viewer.waitForAsset(deleted);

  await app.viewer.deleteButton.click();
  await app.viewer.waitForAsset(next);
  await app.viewer.backButton.click();

  await expect(app.largeFiles.thumbnail(next)).toBeVisible();
  await expect(app.largeFiles.thumbnails).toHaveCount(2);
  await expect(app.largeFiles.thumbnail(deleted)).toHaveCount(0);
  expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [deleted.id], force: false } });
});
