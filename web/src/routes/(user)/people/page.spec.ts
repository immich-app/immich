import { Route } from '#lib/route.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect } from 'vitest';
import { userEvent } from 'vitest/browser';
import Page from './+page.svelte';
import { load } from './+page.ts';

test('renaming to an existing name offers a merge', async ({ data, router, render, settle, app, api }) => {
  const alice = factory.person({ name: 'Alice' });
  const unnamed = factory.person({ name: '' });
  data.addPeople([alice, unnamed]);
  await router.goto(Route.people());
  await render(Page, load);
  await settle();

  await app.people.nameInput(1).fill('alice');
  await userEvent.keyboard('{Enter}');
  await settle();

  expect(api.searchPerson).toHaveBeenCalledWith({ params: { name: 'alice', withHidden: true } });
  await expect.element(app.people.mergeDialog('Alice')).toBeVisible();
  expect(api.updatePerson).not.toHaveBeenCalled();
});

test('renaming a person to a new name saves it', async ({ data, router, render, settle, app, api }) => {
  const alice = factory.person({ name: 'Alice' });
  const unnamed = factory.person({ name: '' });
  data.addPeople([alice, unnamed]);
  await router.goto(Route.people());
  await render(Page, load);
  await settle();

  await app.people.nameInput(1).fill('Bob');
  await userEvent.keyboard('{Enter}');
  await settle();

  expect(api.updatePerson).toHaveBeenCalledWith({ params: { id: unnamed.id }, body: { name: 'Bob' } });
  await expect.element(app.people.mergeDialog('Alice')).not.toBeInTheDocument();
});
