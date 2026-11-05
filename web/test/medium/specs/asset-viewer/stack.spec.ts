import { Route } from '#lib/route.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { factory } from '#test/medium/mock/factories.ts';

test('stack strip lists the stack and the detail panel follows the selected asset', async ({ page, data, app }) => {
  const primary = factory.asset({ tags: [factory.tag({ name: '1', value: 'test/1' })] });
  const second = factory.asset({ tags: [factory.tag({ name: '2', value: 'test/2' })] });
  data
    .addStack(factory.stack({ assets: [primary, second] }))
    .setPreferences(factory.preferences({ tags: { enabled: true, sidebarWeb: false } }));
  await page.goto(Route.viewAsset({ id: primary.id }));
  await app.viewer.waitForAsset(primary);

  await expect(app.viewer.stack).toBeVisible();
  await expect(app.viewer.stack.locator('[data-asset]')).toHaveCount(2);

  await app.viewer.openDetailPanel();
  await expect(app.viewer.tags.first()).toHaveText('test/1');

  await app.viewer.stackThumbnail(second).click();
  await expect(app.viewer.tags.first()).toHaveText('test/2');
});
