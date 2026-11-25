import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import type { App } from '#test/medium/app.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import type { Request } from '@playwright/test';

const atNoon = (second: number) => `2025-06-01T12:00:0${second}.000Z`;

test.describe('geolocation', () => {
  test('sets the location of the selected assets', async ({ page, data, api, app }) => {
    const [first, second] = [factory.asset({ fileCreatedAt: atNoon(1) }), factory.asset({ fileCreatedAt: atNoon(0) })];
    data.addAssets([first, second]);
    await page.goto(Route.geolocationUtility());
    await app.geolocation.chooseOnMapButton.click();
    await app.geolocation.locationPicker.latitudeInput.fill('48.8566');
    await app.geolocation.locationPicker.longitudeInput.fill('2.3522');
    await app.geolocation.locationPicker.confirmButton.click();
    await app.timeline.thumbnail(first).click();
    await app.timeline.thumbnail(second).click();

    await app.geolocation.applyButton.click();
    await app.dialogButton('confirm').click();

    await expect(app.geolocation.gpsBadge(first)).toBeVisible();
    await expect(app.geolocation.gpsBadge(second)).toBeVisible();
    await expect(app.timeline.selected).toHaveCount(0);
    expect(api.updateAssets).toHaveBeenCalledWith({
      body: { ids: [first.id, second.id], latitude: 48.8566, longitude: 2.3522 },
    });
  });

  test('a second save on the same assets shows its location', async ({ page, data, api, app }) => {
    const [first, second] = [factory.asset({ fileCreatedAt: atNoon(1) }), factory.asset({ fileCreatedAt: atNoon(0) })];
    data.addAssets([first, second]);
    await page.goto(Route.geolocationUtility());
    await pickLocation(app, '48.8566', '2.3522');
    await app.timeline.thumbnail(first).click();
    await app.timeline.thumbnail(second).click();
    await app.geolocation.applyButton.click();
    await app.dialogButton('confirm').click();
    await expect(app.geolocation.gpsBadge(first)).toBeVisible();
    await app.timeline.selectDay(first);
    await pickLocation(app, '35.6762', '139.6503');

    await app.geolocation.applyButton.click();
    await app.dialogButton('confirm').click();

    await expect(app.timeline.selected).toHaveCount(0);
    await app.timeline.thumbnail(second).click();
    await expect(app.geolocation.selectedLocation).toContainText('35.676, 139.650');
    expect(api.updateAssets).toHaveBeenCalledWith({
      body: { ids: [first.id, second.id], latitude: 48.8566, longitude: 2.3522 },
    });
    expect(api.updateAssets).toHaveBeenCalledWith({
      body: { ids: [first.id, second.id], latitude: 35.6762, longitude: 139.6503 },
    });
  });

  test('assets of a partner are not selectable', async ({ page, data, app }) => {
    const partnerAsset = factory.asset({ ownerId: crypto.randomUUID(), fileCreatedAt: atNoon(1) });
    const ownAsset = factory.asset({ fileCreatedAt: atNoon(0) });
    data.addAssets([partnerAsset, ownAsset]);
    await page.goto(Route.geolocationUtility());

    await app.timeline.thumbnail(partnerAsset).click();
    await app.timeline.thumbnail(ownAsset).click();

    await expect(app.timeline.selected).toHaveCount(1);
    await expect(app.timeline.thumbnail(ownAsset)).toHaveAttribute('data-selected');
  });

  test('shift-click on an asset with a location selects the range', async ({ page, data, app }) => {
    const [first, middle] = [factory.asset({ fileCreatedAt: atNoon(2) }), factory.asset({ fileCreatedAt: atNoon(1) })];
    const located = factory.asset({ fileCreatedAt: atNoon(0), exifInfo: { latitude: 48.8566, longitude: 2.3522 } });
    data.addAssets([first, middle, located]);
    await page.goto(Route.geolocationUtility());
    await app.geolocation.allButton.click();
    await app.timeline.thumbnail(first).click();

    await page.keyboard.down('Shift');
    await app.timeline.thumbnail(located).click();
    await page.keyboard.up('Shift');

    await expect(app.timeline.selected).toHaveCount(3);
  });

  test('a failed location save shows an error and keeps the selection', async ({ page, data, api, logger, app }) => {
    const located = factory.asset({ exifInfo: { latitude: 48.85, longitude: 2.35 } });
    const missing = factory.asset();
    data.addAssets([located, missing]);
    api.on({ updateAssets: () => ({ status: 500, json: { message: 'Server error', statusCode: 500 } }) });
    await page.goto(Route.geolocationUtility());
    await app.geolocation.allButton.click();
    await app.timeline.thumbnail(located).click();
    await app.timeline.thumbnail(missing).click();
    await app.geolocation.applyButton.click();

    await app.dialogButton('confirm').click();

    await expect(app.toast(/Server error/)).toBeVisible();
    await expect(app.geolocation.unselectAllButton).toBeEnabled();
    expect(logger.error).toHaveBeenCalledWith(/500/);
    expect(api.updateAssets).toHaveBeenCalledWith({
      body: { ids: [missing.id], latitude: 48.85, longitude: 2.35 },
    });
  });

  test('shows only assets without a location by default', async ({ page, data, app }) => {
    const located = factory.asset({ fileCreatedAt: atNoon(1), exifInfo: { latitude: 48.85, longitude: 2.35 } });
    const missing = factory.asset({ fileCreatedAt: atNoon(0) });
    data.addAssets([located, missing]);

    await page.goto(Route.geolocationUtility());

    await expect(app.timeline.thumbnail(missing)).toBeVisible();
    await expect(app.timeline.thumbnail(located)).toHaveCount(0);
  });

  test('all shows assets with a location too', async ({ page, data, app }) => {
    const located = factory.asset({ fileCreatedAt: atNoon(1), exifInfo: { latitude: 48.85, longitude: 2.35 } });
    const missing = factory.asset({ fileCreatedAt: atNoon(0) });
    data.addAssets([located, missing]);
    await page.goto(Route.geolocationUtility());

    await app.geolocation.allButton.click();

    await expect(app.timeline.thumbnail(located)).toBeVisible();
    await expect(app.timeline.thumbnail(missing)).toBeVisible();
  });

  test('shows the place of a location picked on the map', async ({ page, api, app }) => {
    api.on({ reverseGeocode: () => ({ json: [{ city: 'Paris', country: 'France', state: null }] }) });
    await page.goto(Route.geolocationUtility());

    await pickLocation(app, '48.8566', '2.3522');

    await expect(app.geolocation.selectedLocation).toContainText('Paris, France');
    expect(api.reverseGeocode).toHaveBeenCalledWith({ params: { lat: 48.8566, lon: 2.3522 } });
  });

  test('shows the coordinates when the place lookup fails', async ({ page, api, logger, app }) => {
    api.on({ reverseGeocode: () => ({ status: 500, json: { message: 'Server error', statusCode: 500 } }) });
    await page.goto(Route.geolocationUtility());

    await pickLocation(app, '48.8566', '2.3522');

    await expect(app.geolocation.selectedLocation).toContainText('48.857, 2.352');
    expect(logger.error).toHaveBeenCalledWith(/500/);
  });

  test('keeps the latest picked place when an earlier lookup finishes last', async ({ page, api, app }) => {
    const { promise: parisLookup, resolve: finishParisLookup } = Promise.withResolvers<void>();
    api.on({
      reverseGeocode: async ({ params }) => {
        if (params.lat === 48.8566) {
          await parisLookup;
          return { json: [{ city: 'Paris', country: 'France', state: null }] };
        }
        return { json: [{ city: 'Tokyo', country: 'Japan', state: null }] };
      },
    });
    const parisSettled = Promise.withResolvers<void>();
    const onParisSettled = (request: Request) => {
      if (/reverse-geocode\?lat=48\.8566/.test(request.url())) {
        parisSettled.resolve();
      }
    };
    page.on('requestfinished', onParisSettled);
    page.on('requestfailed', onParisSettled);
    await page.goto(Route.geolocationUtility());
    await pickLocation(app, '48.8566', '2.3522');
    await pickLocation(app, '35.6762', '139.6503');
    await expect(app.geolocation.selectedLocation).toContainText('Tokyo, Japan');

    finishParisLookup();
    await parisSettled.promise;
    await page.evaluate(() => new Promise(requestAnimationFrame));

    await expect(app.geolocation.selectedLocation).toContainText('Tokyo, Japan');
  });
});

const pickLocation = async (app: App, latitude: string, longitude: string) => {
  await app.geolocation.chooseOnMapButton.click();
  await app.geolocation.locationPicker.latitudeInput.fill(latitude);
  await app.geolocation.locationPicker.longitudeInput.fill(longitude);
  await app.geolocation.locationPicker.confirmButton.click();
};
