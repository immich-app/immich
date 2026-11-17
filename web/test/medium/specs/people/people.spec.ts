import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test('searching shows only the matching people', async ({ page, data, api, app }) => {
  data.addPeople([factory.person({ name: 'Alice' }), factory.person({ name: 'Bob' })]);
  await page.goto(Route.people());
  await expect(app.people.thumbnail('Bob')).toBeVisible();

  await app.people.searchInput.fill('ali');
  await app.people.searchInput.press('Enter');

  await expect(app.people.thumbnail('Bob')).toBeHidden();
  await expect(app.people.thumbnail('Alice')).toBeVisible();
  expect(api.getAllPeople).toHaveBeenCalledWith({ params: { withHidden: true, name: 'ali' } });
});

test('refreshes a face once its thumbnail is ready', async ({ page, data, api, app }) => {
  data.addPeople(factory.person({ name: 'Alice' }));
  await page.goto(Route.people());
  await expect(app.people.thumbnail('Alice')).toHaveAttribute('src', /updatedAt=2025-01-01/);

  api.emit('on_person_thumbnail', data.getPeople()[0].id);

  await expect(app.people.thumbnail('Alice')).not.toHaveAttribute('src', /updatedAt=2025-01-01/);
});
