import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test('api key list shows keys added elsewhere', async ({ page, data, api, app }) => {
  data.addApiKeys(factory.apiKey({ name: 'Laptop' }));
  await page.goto(Route.userSettings());
  await app.settings.openSection('api_keys');
  await expect(app.settings.apiKeys.name('Laptop')).toBeVisible();

  data.addApiKeys(factory.apiKey({ name: 'Added elsewhere' }));
  await expect(() =>
    api.emit('ResourceUpdateV1', { paths: ['/api-keys'], correlationId: 'another-device.1' }),
  ).toPass();

  await expect(app.settings.apiKeys.name('Added elsewhere')).toBeVisible();
});
