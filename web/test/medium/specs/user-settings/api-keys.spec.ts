import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test('shows new api keys from another source', async ({ page, data, api, app }) => {
  data.addApiKeys(factory.apiKey({ name: 'Existing key' }));
  await page.goto(Route.userSettings());
  await app.settings.openSection('api_keys');
  await expect(app.settings.apiKeys.name('Existing key')).toBeVisible();

  data.addApiKeys(factory.apiKey({ name: 'New key' }));
  await api.emitResourceEvent({ changed: ['/api-keys'] });

  await expect(app.settings.apiKeys.name('New key')).toBeVisible();
});
