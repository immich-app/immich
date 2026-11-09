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
