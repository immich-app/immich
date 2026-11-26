import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test('shows new sessions from another source', async ({ page, data, api, app }) => {
  data.addSessions(factory.session({ current: true, deviceOS: 'Existing OS' }));
  await page.goto(Route.userSettings());
  await app.settings.openSection('authorized_devices');
  await expect(app.text(/Existing OS/)).toBeVisible();

  data.addSessions(factory.session({ deviceOS: 'New OS' }));
  await api.emitResourceEvent({ changed: ['/sessions'] });

  await expect(app.text(/New OS/)).toBeVisible();
});
