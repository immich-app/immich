import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import type { App } from '#test/medium/app.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { AssetVisibility } from '@immich/sdk';

const largeFileUrl = (asset: { id: string }) => `${Route.largeFileUtility()}/photos/${asset.id}`;

const setup = () =>
  [3, 2, 1].map((megabytes) => factory.asset({ exifInfo: { fileSizeInByte: megabytes * 1_000_000 } }));

const actionsThatStay = [
  {
    name: 'permanently deleting',
    act: (app: App) => app.viewer.permanentlyDeleteWithShortcut(),
    operation: 'deleteAssets' as const,
    request: (id: string) => ({ body: { ids: [id], force: true } }),
    listed: 0,
  },
  {
    name: 'archiving',
    act: (app: App) => app.viewer.archive(),
    operation: 'updateAsset' as const,
    request: (id: string) => ({ params: { id }, body: { visibility: AssetVisibility.Archive } }),
    listed: 1,
  },
  {
    name: 'locking',
    act: (app: App) => app.viewer.moveToLockedFolder(),
    operation: 'updateAssets' as const,
    request: (id: string) => ({ body: { ids: [id], visibility: AssetVisibility.Locked } }),
    listed: 1,
  },
];

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

for (const { name, act, operation, request, listed } of actionsThatStay) {
  test(`${name} keeps the viewer open on the large file`, async ({ page, data, api, app }) => {
    const [asset] = setup();
    data.addAssets(asset);
    await page.goto(largeFileUrl(asset));
    await app.viewer.waitForAsset(asset);

    await act(app);

    await expect.poll(() => api[operation].calls).toHaveLength(1);
    await app.viewer.waitForAsset(asset);
    await expect(page).toHaveURL(largeFileUrl(asset));
    await app.viewer.backButton.click();
    await expect(app.largeFiles.thumbnails).toHaveCount(listed);
    expect(api[operation]).toHaveBeenCalledWith(request(asset.id));
  });
}
