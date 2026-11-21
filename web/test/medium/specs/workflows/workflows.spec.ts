import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test('shows new workflows from another source', async ({ page, data, api, app }) => {
  data.addWorkflows(factory.workflow({ name: 'Existing workflow' }));
  await page.goto(Route.workflows());
  await expect(app.text('Existing workflow')).toBeVisible();

  data.addWorkflows(factory.workflow({ name: 'New workflow' }));
  await api.emitResourceEvent({ changed: ['/workflows'] });

  await expect(app.text('New workflow')).toBeVisible();
});
