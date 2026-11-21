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
