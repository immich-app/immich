import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test('renaming a person to an existing name offers a merge', async ({ page, data, api, app }) => {
  const alice = factory.person({ name: 'Alice' });
  const unnamed = factory.person({ name: '' });
  data.addPeople([alice, unnamed]);
  await page.goto(Route.viewPerson(unnamed));

  await app.person.editNameButton.click();
  await app.person.nameInput.fill('alice');
  await app.person.doneButton.click();

  await expect(app.person.mergeDialog('Alice')).toBeVisible();
  expect(api.searchPerson).toHaveBeenCalledWith({ params: { name: 'alice', withHidden: true } });
  expect(api.updatePerson).not.toHaveBeenCalled();
});

test('renaming a person to a new name saves it', async ({ page, data, api, app }) => {
  const unnamed = factory.person({ name: '' });
  data.addPeople(unnamed);
  await page.goto(Route.viewPerson(unnamed));

  await app.person.editNameButton.click();
  await app.person.nameInput.fill('Bob');
  await app.person.doneButton.click();

  await expect.poll(() => api.updatePerson.calls.length).toBe(1);
  expect(api.updatePerson).toHaveBeenCalledWith({ params: { id: unnamed.id }, body: { name: 'Bob' } });
});
