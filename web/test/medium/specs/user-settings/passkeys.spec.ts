import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test('shows new passkeys from another source', async ({ page, data, api, app }) => {
  data.addPasskeys(factory.passkey({ name: 'Existing passkey' }));
  await page.goto(Route.userSettings());
  await app.settings.openSection('passkeys');
  await expect(app.text('Existing passkey')).toBeVisible();

  data.addPasskeys(factory.passkey({ name: 'New passkey' }));
  await api.emitResourceEvent({ changed: ['/passkeys'] });

  await expect(app.text('New passkey')).toBeVisible();
});
