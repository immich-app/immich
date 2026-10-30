import { Route } from '#lib/route.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { factory } from '#test/medium/mock/factories.ts';

test('arrow keys move between the assets of a duplicate group', async ({ page, data, app }) => {
  const [first, second] = [factory.asset(), factory.asset()];
  data.addDuplicates(first, second);
  await page.goto(Route.duplicatesUtility());

  await page.getByRole('button', { name: 'view', exact: true }).first().click();
  await expect(app.viewer.root).toBeVisible();
  const viewedAssetId = () => new URL(page.url()).pathname.split('/').at(-1);
  const initial = viewedAssetId();
  expect([first.id, second.id]).toContain(initial);

  await page.keyboard.press('ArrowRight');
  await expect.poll(viewedAssetId).not.toBe(initial);
  await page.keyboard.press('ArrowLeft');
  await expect.poll(viewedAssetId).toBe(initial);
});
