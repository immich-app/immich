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

test('shared links show links created elsewhere', async ({ page, data, api, app }) => {
  const [existing, added] = [
    factory.sharedLink({ assets: [factory.asset()] }),
    factory.sharedLink({ assets: [factory.asset()] }),
  ];
  data.addSharedLinks(existing);
  await page.goto(Route.sharedLinks());
  await expect(app.sharedLink.card(existing)).toBeVisible();

  await app.navbar.logoLink.click();
  await expect(page).toHaveURL(Route.photos());
  data.addSharedLinks(added);
  const requests = api.getAllSharedLinks.calls.length;
  await page.goBack();

  await expect(app.sharedLink.card(added)).toBeVisible();
  expect(api.getAllSharedLinks.calls.length).toBeGreaterThan(requests);
});

test('workflows show workflows created elsewhere', async ({ page, data, api, app }) => {
  data.addWorkflows(factory.workflow({ name: 'Existing workflow' }));
  await page.goto(Route.workflows());
  await expect(page.getByText('Existing workflow', { exact: true })).toBeVisible();

  await app.navbar.logoLink.click();
  await expect(page).toHaveURL(Route.photos());
  data.addWorkflows(factory.workflow({ name: 'Added elsewhere' }));
  const requests = api.searchWorkflows.calls.length;
  await page.goBack();

  await expect(page.getByText('Added elsewhere', { exact: true })).toBeVisible();
  expect(api.searchWorkflows.calls.length).toBeGreaterThan(requests);
});

test('user settings show api keys created elsewhere', async ({ page, data, api, app }) => {
  data.addApiKeys(factory.apiKey({ name: 'Existing key' }));
  await page.goto(Route.userSettings());
  await app.settings.openSection('api_keys');
  await expect(page.getByText('Existing key', { exact: true })).toBeVisible();

  await app.navbar.logoLink.click();
  await expect(page).toHaveURL(Route.photos());
  data.addApiKeys(factory.apiKey({ name: 'Added elsewhere' }));
  const requests = api.getApiKeys.calls.length;
  await page.goBack();
  await app.settings.openSection('api_keys');

  await expect(page.getByText('Added elsewhere', { exact: true })).toBeVisible();
  expect(api.getApiKeys.calls.length).toBeGreaterThan(requests);
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

test('user administration shows users created elsewhere', async ({ page, data, api, app }) => {
  await page.goto(Route.users());
  await expect(page.getByText(data.user.email)).toBeVisible();

  await app.navbar.logoLink.click();
  await expect(page).toHaveURL(Route.photos());
  data.addUsers({ email: 'added@immich.cloud' });
  const requests = api.searchUsersAdmin.calls.length;
  await page.goBack();

  await expect(page.getByText('added@immich.cloud')).toBeVisible();
  expect(api.searchUsersAdmin.calls.length).toBeGreaterThan(requests);
});

test('library management shows libraries created elsewhere', async ({ page, data, api, app }) => {
  data.addLibraries(factory.library({ name: 'Existing library' }));
  await page.goto(Route.libraries());
  await expect(page.getByText('Existing library', { exact: true })).toBeVisible();

  await app.navbar.logoLink.click();
  await expect(page).toHaveURL(Route.photos());
  data.addLibraries(factory.library({ name: 'Added elsewhere' }));
  const requests = api.getAllLibraries.calls.length;
  await page.goBack();

  await expect(page.getByText('Added elsewhere', { exact: true })).toBeVisible();
  expect(api.getAllLibraries.calls.length).toBeGreaterThan(requests);
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
