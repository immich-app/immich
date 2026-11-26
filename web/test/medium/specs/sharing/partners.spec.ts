import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { PartnerDirection } from '@immich/sdk';

test('shows new partners from another source', async ({ page, data, api, app }) => {
  data.addPartners(PartnerDirection.SharedWith, factory.partner({ name: 'Existing partner' }));
  await page.goto(Route.sharing());
  await expect(app.text('Existing partner')).toBeVisible();

  data.addPartners(PartnerDirection.SharedWith, factory.partner({ name: 'New partner' }));
  await api.emitResourceEvent({ changed: ['/partners'] });

  await expect(app.text('New partner')).toBeVisible();
});
