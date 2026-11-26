import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test('album list shows albums added elsewhere', async ({ page, data, api, app }) => {
  data.addAlbums(factory.album({ albumName: 'Holiday' }));
  await page.goto(Route.albums());
  await expect(page.getByText('Holiday', { exact: true }).first()).toBeVisible();

  await app.navbar.logoLink.click();
  await expect(page).toHaveURL(Route.photos());
  data.addAlbums(factory.album({ albumName: 'Added elsewhere' }));
  const requests = api.getAllAlbums.calls.length;
  await page.goBack();

  await expect(page.getByText('Added elsewhere', { exact: true }).first()).toBeVisible();
  expect(api.getAllAlbums.calls.length).toBeGreaterThan(requests);
});

test('album shows changes made elsewhere', async ({ page, data, api, app }) => {
  const album = factory.album({ albumName: 'Original name' });
  data.addAlbums(album);
  await page.goto(Route.viewAlbum(album));
  await expect(page).toHaveTitle(/Original name/);

  await app.album.backButton.click();
  await expect(page).toHaveURL(Route.albums());
  data.updateAlbum(album.id, { albumName: 'Renamed elsewhere' });
  const requests = api.getAlbumInfo.calls.length;
  await page.goBack();

  await expect(page).toHaveTitle(/Renamed elsewhere/);
  expect(api.getAlbumInfo.calls.length).toBeGreaterThan(requests);
});

test('sharing shows albums shared elsewhere', async ({ page, data, api, app }) => {
  data.addAlbums(factory.album({ albumName: 'Shared before', shared: true }));
  await page.goto(Route.sharing());
  await expect(page.getByText('Shared before', { exact: true }).first()).toBeVisible();

  await app.navbar.logoLink.click();
  await expect(page).toHaveURL(Route.photos());
  data.addAlbums(factory.album({ albumName: 'Shared elsewhere', shared: true }));
  const requests = api.getAllAlbums.calls.length;
  await page.goBack();

  await expect(page.getByText('Shared elsewhere', { exact: true }).first()).toBeVisible();
  expect(api.getAllAlbums.calls.length).toBeGreaterThan(requests);
});

test('duplicates show duplicates detected in the meantime', async ({ page, data, api, app }) => {
  data.addDuplicates([factory.asset(), factory.asset()]);
  await page.goto(Route.duplicatesUtility());
  await expect(page.getByText('1 / 1', { exact: true })).toBeVisible();

  await app.navbar.logoLink.click();
  await expect(page).toHaveURL(Route.photos());
  data.addDuplicates([factory.asset(), factory.asset()]);
  const requests = api.getAssetDuplicates.calls.length;
  await page.goBack();

  await expect(page.getByText('1 / 2', { exact: true })).toBeVisible();
  expect(api.getAssetDuplicates.calls.length).toBeGreaterThan(requests);
});

test('face editor shows faces detected in the meantime', async ({ page, data, api, app }) => {
  const asset = factory.asset({ width: 4000, height: 3000 });
  const [alice, bob] = [factory.person({ name: 'Alice Johnson' }), factory.person({ name: 'Bob Smith' })];
  data
    .addAssets(asset)
    .addPeople([alice, bob])
    .addFaces(asset.id, factory.face({ person: alice }));
  await page.goto(Route.viewAsset({ id: asset.id }));
  await app.viewer.waitForAsset(asset);
  await app.viewer.openDetailPanel();
  await app.viewer.editPeopleButton.click();
  await expect(app.viewer.deleteFaceButton).toHaveCount(1);

  await app.viewer.editPeopleBackButton.click();
  await expect(app.viewer.editPeopleHeading).toBeHidden();
  data.addFaces(asset.id, factory.face({ person: bob }));
  const requests = api.getFaces.calls.length;
  await app.viewer.editPeopleButton.click();

  await expect(app.viewer.deleteFaceButton).toHaveCount(2);
  expect(api.getFaces.calls.length).toBeGreaterThan(requests);
});

test('viewer shows changes made elsewhere to an asset viewed before', async ({ page, data, api, app }) => {
  const asset = factory.asset();
  data.addAssets(asset);
  await page.goto(Route.photos());
  await app.timeline.thumbnail(asset).click();
  await expect(app.viewer.favoriteButton).toBeVisible();
  await app.viewer.backButton.click();
  await expect(app.viewer.root).toHaveCount(0);
  data.updateAsset(asset.id, { isFavorite: true });
  const requests = api.getAssetInfo.calls.length;

  await app.timeline.thumbnail(asset).click();

  await expect(app.viewer.unfavoriteButton).toBeVisible();
  expect(api.getAssetInfo.calls.length).toBeGreaterThan(requests);
});

test('download of an asset viewed before uses the name it got elsewhere', async ({ page, data, api, app }) => {
  const asset = factory.asset({ originalFileName: 'holiday.jpg' });
  data.addAssets(asset);
  await page.goto(Route.photos());
  await app.timeline.thumbnail(asset).click();
  await app.viewer.waitForAsset(asset);
  await app.viewer.backButton.click();
  await expect(app.viewer.root).toHaveCount(0);
  data.addAssets({ ...asset, originalFileName: 'renamed.jpg' });
  await app.timeline.select(asset);

  const [download] = await Promise.all([page.waitForEvent('download'), app.timeline.selectionBar.download()]);

  expect(download.suggestedFilename()).toBe('renamed.jpg');
  expect(api.downloadAsset).toHaveBeenCalledWith({ params: expect.objectContaining({ id: asset.id }) });
});

test('memory shows the location an asset got elsewhere while another was shown', async ({ page, data, app }) => {
  const [first, second] = [
    factory.asset({ exifInfo: { city: 'Paris' } }),
    factory.asset({ exifInfo: { city: 'Tokyo' } }),
  ];
  const memory = factory.memory({ assets: [first, second] });
  data.addAssets([first, second]).addMemories(memory);
  await page.goto(Route.viewMemory({ id: memory.id, assetId: first.id }));
  await expect(app.memory.place('Paris')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(app.memory.place('Tokyo')).toBeVisible();
  data.addAssets({ ...first, exifInfo: { city: 'London' } });

  await page.keyboard.press('ArrowLeft');

  await expect(app.memory.place('London')).toBeVisible();
});

test('duplicates viewer shows changes made elsewhere to an asset viewed before', async ({ page, data, app }) => {
  const assets = [factory.asset(), factory.asset()];
  data.addDuplicates(assets);
  await page.goto(Route.duplicatesUtility());
  await app.duplicates.viewButton.first().click();
  await expect(app.viewer.favoriteButton).toBeVisible();
  await app.viewer.backButton.click();
  await expect(app.viewer.root).toHaveCount(0);
  data.updateAssets({ ids: assets.map(({ id }) => id), isFavorite: true });

  await app.duplicates.viewButton.first().click();

  await expect(app.viewer.unfavoriteButton).toBeVisible();
});
