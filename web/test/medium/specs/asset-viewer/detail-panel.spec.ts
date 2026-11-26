import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { SharedLinkType } from '@immich/sdk';

test.describe('detail panel', () => {
  test('description edits persist after closing and reopening the panel', async ({ page, data, api, app }) => {
    const asset = factory.asset();
    data.addAssets(asset);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);

    await app.viewer.infoButton.click();
    await app.viewer.description.fill('new description');
    await expect(app.viewer.description).toHaveValue('new description');

    await app.viewer.infoButton.click();
    await expect(app.viewer.description).not.toBeVisible();
    expect(api.updateAsset).toHaveBeenCalledWith({
      params: { id: asset.id },
      body: { description: 'new description' },
    });

    api.emit('on_asset_update', data.getAsset(asset.id));
    await app.viewer.infoButton.click();
    await expect(app.viewer.description).toHaveValue('new description');
  });

  test('date editor shows the asset zone and saves a date in a chosen one', async ({ page, data, api, app }) => {
    const asset = factory.asset({
      fileCreatedAt: '2025-12-01T18:30:00.000Z',
      localDateTime: '2025-12-01T11:30:00.000Z',
      exifInfo: { dateTimeOriginal: '2025-12-01T18:30:00.000Z', timeZone: 'America/Denver' },
    });
    data.addAssets(asset);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);

    await app.viewer.infoButton.click();
    await app.viewer.editDateButton.click();
    await expect(app.dialog).toBeVisible();

    await expect(app.viewer.changeDate.dateInput).toHaveValue('2025-12-01T11:30');
    await expect(app.viewer.changeDate.timezoneInput).toHaveValue('America/Denver (-07:00)');

    await app.viewer.changeDate.timezoneInput.fill('Pacific/Pitcairn');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(app.viewer.changeDate.timezoneInput).toHaveValue('Pacific/Pitcairn (-08:00)');

    await app.viewer.changeDate.dateInput.fill('2025-12-01T12:00');
    await expect(app.viewer.changeDate.timezoneInput).toHaveValue('Pacific/Pitcairn (-08:00)');
    await app.viewer.changeDate.confirmButton.click();

    await expect(app.dialog).toHaveCount(0);
    expect(api.updateAsset).toHaveBeenCalledWith({
      params: { id: asset.id },
      body: { dateTimeOriginal: '2025-12-01T12:00:00.000-08:00' },
    });
  });

  test('location editor clamps coordinates to the valid range', async ({ data, api, app, page }) => {
    const asset = factory.asset({
      exifInfo: { latitude: 38.97, longitude: -109.71, city: 'Thompson Springs', country: 'United States' },
    });
    data.addAssets(asset);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);

    await app.viewer.openDetailPanel();
    await app.viewer.editLocationButton.click();
    await app.viewer.changeLocation.latitudeInput.fill('95');
    await expect(app.viewer.changeLocation.latitudeInput).toHaveValue('90');
    await app.viewer.changeLocation.longitudeInput.fill('-200');
    await expect(app.viewer.changeLocation.longitudeInput).toHaveValue('-180');
    await app.viewer.changeLocation.confirmButton.click();

    expect(api.updateAsset).toHaveBeenCalledWith({ params: { id: asset.id }, body: { latitude: 90, longitude: -180 } });
  });

  test('location editor searches places and uses the chosen one', async ({ data, api, app, page }) => {
    const asset = factory.asset({
      exifInfo: { latitude: null, longitude: null, city: null, state: null, country: null },
    });
    data.addAssets(asset).addPlaces([
      { name: 'Paris', admin1name: 'Île-de-France', latitude: 48.8566, longitude: 2.3522 },
      { name: 'Tokyo', admin1name: 'Tokyo', latitude: 35.6762, longitude: 139.6503 },
    ]);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);
    await app.viewer.openDetailPanel();
    await app.viewer.addLocationButton.click();

    await app.viewer.changeLocation.searchInput.fill('par');
    await expect(app.viewer.changeLocation.place('Tokyo, Tokyo')).toHaveCount(0);
    await app.viewer.changeLocation.place('Paris, Île-de-France').click();
    await app.viewer.changeLocation.confirmButton.click();

    expect(api.searchPlaces).toHaveBeenCalledWith({ params: { name: 'par' } });
    expect(api.updateAsset).toHaveBeenCalledWith({
      params: { id: asset.id },
      body: { latitude: 48.8566, longitude: 2.3522 },
    });
  });

  test('opens on a shared link and stays closed when metadata is hidden', async ({ page, context, data, app }) => {
    const asset = factory.asset();
    const other = factory.asset();
    const visible = factory.sharedLink({ type: SharedLinkType.Individual, assets: [asset, other] });
    const hidden = factory.sharedLink({ type: SharedLinkType.Individual, assets: [asset, other], showMetadata: false });
    data.addSharedLinks(visible).addSharedLinks(hidden);
    await context.clearCookies();

    await page.goto(`${Route.viewSharedLink({ key: visible.key })}/photos/${asset.id}`);
    await app.viewer.waitForAsset(asset);
    await expect(app.viewer.infoButton).toBeVisible();
    await page.keyboard.press('i');
    await expect(app.viewer.detailPanel).toBeVisible();
    await page.keyboard.press('i');
    await expect(app.viewer.detailPanel).toHaveCount(0);

    await page.goto(`${Route.viewSharedLink({ key: hidden.key })}/photos/${asset.id}`);
    await app.viewer.waitForAsset(asset);
    await expect(app.viewer.infoButton).toHaveCount(0);
    await page.keyboard.press('i');
    await expect(app.viewer.detailPanel).toHaveCount(0);
  });

  test('description follows the asset and a draft is saved, not carried over', async ({ page, data, api, app }) => {
    const [first, second] = [
      factory.asset({ fileCreatedAt: '2024-06-02T12:00:00.000Z', exifInfo: { description: 'first description' } }),
      factory.asset({ fileCreatedAt: '2024-06-01T12:00:00.000Z', exifInfo: { description: 'second description' } }),
    ];
    data.addAssets([first, second]);
    await page.goto(Route.viewAsset({ id: first.id }));
    await app.viewer.waitForAsset(first);

    await app.viewer.infoButton.click();
    await expect(app.viewer.description).toHaveValue('first description');

    await app.viewer.nextButton.click();
    await app.viewer.waitForAsset(second);
    await expect(app.viewer.description).toHaveValue('second description');

    await app.viewer.description.fill('unsaved draft');
    await app.viewer.previousButton.click();
    await app.viewer.waitForAsset(first);
    await expect(app.viewer.description).toHaveValue('first description');
    expect(api.updateAsset).toHaveBeenCalledWith({ params: { id: second.id }, body: { description: 'unsaved draft' } });
  });

  test('shows the star rating when ratings are enabled', async ({ page, data, app }) => {
    data.setPreferences(factory.preferences({ ratings: { enabled: true } }));
    const asset = factory.asset({ exifInfo: { rating: 3 } });
    data.addAssets(asset);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);

    await app.viewer.infoButton.click();
    await expect(app.viewer.rating).toBeVisible();
    await expect(app.viewer.rating.getByRole('radio', { checked: true })).toHaveValue('3');
  });

  test('rates an asset', async ({ page, data, api, app }) => {
    data.setPreferences(factory.preferences({ ratings: { enabled: true } }));
    const asset = factory.asset({ exifInfo: { rating: 3 } });
    data.addAssets(asset);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);
    await app.viewer.openDetailPanel();

    await app.viewer.ratingStar(5).click();

    await expect(app.viewer.rating.getByRole('radio', { checked: true })).toHaveValue('5');
    expect(api.updateAsset).toHaveBeenCalledWith({ params: { id: asset.id }, body: { rating: 5 } });
  });

  test('camera follows the asset when moving to the next one', async ({ page, data, app }) => {
    const [canon, nikon] = [
      factory.asset({ fileCreatedAt: '2024-06-02T12:00:00.000Z', exifInfo: { make: 'Canon', model: 'EOS R5' } }),
      factory.asset({ fileCreatedAt: '2024-06-01T12:00:00.000Z', exifInfo: { make: 'Nikon', model: 'Z6' } }),
    ];
    data.addAssets([canon, nikon]);
    await page.goto(Route.viewAsset({ id: canon.id }));
    await app.viewer.waitForAsset(canon);
    await app.viewer.openDetailPanel();
    await expect(app.viewer.detailPanel.getByText('Canon EOS R5')).toBeVisible();

    await app.viewer.nextButton.click();
    await app.viewer.waitForAsset(nikon);

    await expect(app.viewer.detailPanel.getByText('Nikon Z6')).toBeVisible();
    await expect(app.viewer.detailPanel.getByText('Canon EOS R5')).toHaveCount(0);
  });

  test('owner can edit the description on a shared link', async ({ page, data, app }) => {
    const asset = factory.asset();
    const link = factory.sharedLink({ type: SharedLinkType.Individual, assets: [asset, factory.asset()] });
    data.addSharedLinks(link);
    await page.goto(`${Route.viewSharedLink({ key: link.key })}/photos/${asset.id}`);
    await app.viewer.waitForAsset(asset);

    await app.viewer.infoButton.click();
    await expect(app.viewer.description).toBeVisible();
    await expect(app.viewer.description).toBeEnabled();
  });

  for (const { key, rating } of [
    { key: '1', rating: 1 },
    { key: '2', rating: 2 },
    { key: '3', rating: 3 },
    { key: '4', rating: 4 },
    { key: '5', rating: 5 },
    { key: '0', rating: null },
  ]) {
    test(`pressing ${key} sets the rating to ${rating}`, async ({ page, data, api, app }) => {
      data.setPreferences(factory.preferences({ ratings: { enabled: true } }));
      const asset = factory.asset({ exifInfo: { rating: rating === 1 ? 2 : 1 } });
      data.addAssets(asset);
      await page.goto(Route.viewAsset({ id: asset.id }));
      await app.viewer.waitForAsset(asset);

      await page.keyboard.press(key);

      await expect.poll(() => api.updateAsset.calls.length).toBe(1);
      expect(api.updateAsset).toHaveBeenCalledWith({ params: { id: asset.id }, body: { rating } });
    });
  }

  test('pressing the current rating sends no request', async ({ page, data, api, app }) => {
    data.setPreferences(factory.preferences({ ratings: { enabled: true } }));
    const asset = factory.asset({ exifInfo: { rating: 3 } });
    data.addAssets(asset);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);
    await app.viewer.openDetailPanel();

    await page.keyboard.press('3');
    await page.keyboard.press('4');

    await expect(app.viewer.rating.getByRole('radio', { checked: true })).toHaveValue('4');
    expect(api.updateAsset).toHaveBeenCalledWith({ params: { id: asset.id }, body: { rating: 4 } });
    expect(api.updateAsset.calls).toHaveLength(1);
  });

  for (const { name, viewers, visible } of [
    { name: 'shows the owner in a shared album', viewers: [factory.user()], visible: true },
    { name: 'hides the owner in an album only the user is in', viewers: [], visible: false },
  ]) {
    test(name, async ({ page, data, app }) => {
      const partner = factory.user({ name: 'Partner Name' });
      const asset = factory.asset({ ownerId: partner.id, owner: partner });
      const album = factory.album({ albumUsers: factory.albumUsers({ owner: data.user, viewers }) });
      data.addAssets(asset).addAlbums(album).addToAlbum(album.id, [asset]);
      await page.goto(Route.viewAlbumAsset({ albumId: album.id, assetId: asset.id }));
      await app.viewer.waitForAsset(asset);

      await app.viewer.openDetailPanel();

      await expect(app.viewer.detailPanel.getByText('Partner Name', { exact: true })).toHaveCount(visible ? 1 : 0);
    });
  }

  test('an update from another device is kept after moving away and back', async ({ page, data, api, app }) => {
    const [asset, next] = data.addTimeline({ years: 1 });
    await page.goto(Route.photos());
    await app.timeline.thumbnail(asset).click();
    await app.viewer.nextButton.click();
    await app.viewer.waitForAsset(next);
    await app.viewer.previousButton.click();
    await app.viewer.waitForAsset(asset);
    await app.viewer.openDetailPanel();
    await expect(app.viewer.description).toHaveValue('');
    data.updateAsset(asset.id, { description: 'edited elsewhere' });
    api.emit('on_asset_update', data.getAsset(asset.id));
    await expect(app.viewer.description).toHaveValue('edited elsewhere');

    await app.viewer.nextButton.click();
    await app.viewer.waitForAsset(next);
    await app.viewer.previousButton.click();

    await app.viewer.waitForAsset(asset);
    await expect(app.viewer.description).toHaveValue('edited elsewhere');
  });

  test('a favorite is kept after moving away and back', async ({ page, data, api, app }) => {
    const [asset, next] = data.addTimeline({ years: 1 });
    await page.goto(Route.photos());
    await app.timeline.thumbnail(asset).click();
    await app.viewer.nextButton.click();
    await app.viewer.waitForAsset(next);
    await app.viewer.previousButton.click();
    await app.viewer.waitForAsset(asset);
    await app.viewer.favoriteButton.click();
    await expect(app.viewer.unfavoriteButton).toBeVisible();

    await app.viewer.nextButton.click();
    await app.viewer.waitForAsset(next);
    await app.viewer.previousButton.click();

    await app.viewer.waitForAsset(asset);
    await expect(app.viewer.unfavoriteButton).toBeVisible();
    expect(api.updateAsset).toHaveBeenCalledWith({ params: { id: asset.id }, body: { isFavorite: true } });
  });
});
