import { queryClient } from '#lib/queries/client.ts';
import { getAllPeoplePagesQuery } from '#lib/queries/person.query.ts';
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

  await app.people.declineMergeButton.click();
  await settle();

  expect(api.updatePerson).toHaveBeenCalledWith({ params: { id: unnamed.id }, body: { name: 'alice' } });
});

test('accepting the merge merges into the existing person', async ({ data, router, render, settle, app, api }) => {
  const alice = factory.person({ name: 'Alice' });
  const unnamed = factory.person({ name: '' });
  data.addPeople([alice, unnamed]);
  await router.goto(Route.people());
  await render(Page, load);
  await settle();
  await app.people.nameInput(1).fill('alice');
  await userEvent.keyboard('{Enter}');
  await settle();

  await app.dialogButton('yes').click();
  await settle();

  expect(api.mergePeople).toHaveBeenCalledWith({ body: { ids: [alice.id, unnamed.id] } });
  expect(api.updatePerson).not.toHaveBeenCalled();
  await expect.element(app.people.nameInput(1)).not.toBeInTheDocument();
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

test('clearing a name saves null', async ({ data, router, render, settle, app, api }) => {
  const alice = factory.person({ name: 'Alice' });
  data.addPeople(alice);
  await router.goto(Route.people());
  await render(Page, load);
  await settle();

  await app.people.nameInput(0).fill('');
  await userEvent.keyboard('{Enter}');
  await settle();

  expect(api.updatePerson).toHaveBeenCalledWith({ params: { id: alice.id }, body: { name: null } });
});

test('saves the shown name when renamed elsewhere', async ({ data, router, render, settle, app, api }) => {
  const ariel = factory.person({ name: 'Ariel' });
  data.addPeople(ariel);
  await router.goto(Route.people());
  await render(Page, load);
  await settle();
  await app.people.nameInput(0).fill('Ariel typed');

  data.updatePerson(ariel.id, { name: 'Ariel remote' });
  await queryClient.invalidateQueries({ queryKey: getAllPeoplePagesQuery({ withHidden: true }).queryKey });
  await settle();

  await expect.element(app.people.nameInput(0)).toHaveValue('Ariel typed');
  await userEvent.keyboard('{Enter}');
  await settle();
  expect(api.updatePerson).toHaveBeenCalledWith({ params: { id: ariel.id }, body: { name: 'Ariel typed' } });
});

test('hiding a person removes the card', async ({ data, router, render, settle, api, app }) => {
  const alice = factory.person({ name: 'Alice' });
  const bob = factory.person({ name: 'Bob' });
  data.addPeople([alice, bob]);
  await router.goto(Route.people());
  await render(Page, load);
  await settle();

  await app.people.cardMenuButton(1).click();
  await app.people.menuItem('hide_person').click();
  await settle();

  expect(api.updatePerson).toHaveBeenCalledWith({ params: { id: bob.id }, body: { isHidden: true } });
  await expect.element(app.people.nameInput(1)).not.toBeInTheDocument();
  await expect.element(app.people.nameInput(0)).toBeVisible();
});

test('filters to favorite people', async ({ router, render, settle, app }) => {
  await router.goto(Route.people());
  await render(Page, load);
  await settle();

  await app.people.filtersButton.click();
  await app.people.filter.favoriteCheckbox.click();
  await app.people.filter.saveButton.click();

  expect(router.url.searchParams.get('isFavorite')).toBe('true');
  expect(router.url.searchParams.has('isHidden')).toBe(false);
});

test('filters to people shared by a user', async ({ data, router, render, settle, api, app }) => {
  const bob = factory.user({ name: 'Bob', clusterGroupId: data.user.clusterGroupId });
  data.addUsers(bob);
  await router.goto(Route.people());
  await render(Page, load);
  await settle();

  await app.people.filtersButton.click();
  await settle();
  await app.people.filter.sharedByButton.click();
  await app.people.filter.user('Bob').click();
  await app.people.filter.saveButton.click();

  expect(api.getClusterGroupUsers).toHaveBeenCalledWith({ params: { id: data.user.clusterGroupId } });
  expect(router.url.searchParams.get('sharedById')).toBe(bob.id);
  expect(router.url.searchParams.has('isFavorite')).toBe(false);
});

test('resetting the filters clears them', async ({ router, render, settle, app }) => {
  await router.goto(`${Route.people()}?isFavorite=true&isHidden=false`);
  await render(Page, load);
  await settle();

  await app.people.filtersButton.click();
  await app.people.filter.resetButton.click();
  await app.people.filter.saveButton.click();

  expect(router.url.searchParams.has('isFavorite')).toBe(false);
  expect(router.url.searchParams.has('isHidden')).toBe(false);
});

test('loads the people matching the filters in the url', async ({ router, render, settle, api }) => {
  await router.goto(`${Route.people()}?isFavorite=true&searchedPeople=ali`);

  await render(Page, load);
  await settle();

  expect(api.getAllPeople).toHaveBeenCalledWith({ params: { withHidden: true, isFavorite: true, name: 'ali' } });
});
