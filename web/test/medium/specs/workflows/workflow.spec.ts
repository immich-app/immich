import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test.describe('workflow editor', () => {
  test('shows the workflow as styled json', async ({ page, data }) => {
    const workflow = factory.workflow({ name: 'Favorites' });
    data.addWorkflows(workflow);
    await page.goto(Route.viewWorkflow(workflow));

    await page.getByRole('button', { name: 'JSON', exact: true }).click();

    await expect(page.locator('.cm-content')).toContainText('"name": "Favorites"');
    await expect(page.locator('.cm-editor')).toHaveCSS('display', 'flex');
    await expect(page.locator('.jse-status-bar')).toBeVisible();
  });
});
