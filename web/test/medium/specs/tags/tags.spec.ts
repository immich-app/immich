import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test('navigation keeps working after opening a tag path that does not exist', async ({ page, data, app }) => {
  const travel = factory.tag({ name: 'Travel' });
  const japan = factory.tag({ name: 'Japan', value: 'Travel/Japan', parentId: travel.id });
  const tokyo = factory.tag({ name: 'Tokyo', value: 'Travel/Japan/Tokyo', parentId: japan.id });
  data.addTags([travel, japan, tokyo]);
  await page.goto(Route.tags({ path: 'Missing' }));

  await app.tags.child('Travel').click();
  await expect(page).toHaveURL(Route.tags({ path: 'Travel' }));

  await app.tags.child('Japan').click();
  await expect(page).toHaveURL(Route.tags({ path: 'Travel/Japan' }));
  await expect(app.tags.child('Tokyo')).toBeVisible();
});
