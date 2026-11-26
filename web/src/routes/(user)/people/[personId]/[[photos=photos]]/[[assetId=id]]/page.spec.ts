import { queryClient } from '#lib/queries/client.ts';
import { getPersonQuery } from '#lib/queries/person.query.ts';
import { Route } from '#lib/route.ts';
import type { MockData } from '#test/common/data.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import type { Mock } from '#test/unit/mocks/mock.ts';
import type { MockRouter } from '#test/unit/mocks/router.ts';
import { PersonUserRole, type PersonResponseDto } from '@immich/sdk';
import { expect, onTestFinished } from 'vitest';
import { userEvent } from 'vitest/browser';
import Page from './+page.svelte';
import { load } from './+page.ts';

type Context = { data: MockData; router: MockRouter; render: Mock['render']; settle: Mock['settle'] };

const showPerson = async ({ data, router, render, settle }: Context, person: PersonResponseDto) => {
  data.addPeople(person);
  await router.goto(Route.viewPerson(person), { personId: person.id });
  await render(Page, load);
  await settle();
};

const alias = (name: string) => ({
  name,
  birthDate: null,
  role: PersonUserRole.Admin,
  sharedById: crypto.randomUUID(),
});

test('lists each alternate name once', async ({ data, router, render, settle, app }) => {
  const person = factory.person({ name: 'Alice', otherPeople: [alias('Ally'), alias('Ally'), alias('Alice')] });

  await showPerson({ data, router, render, settle }, person);

  await expect.element(app.person.altNames('Ally')).toBeVisible();
});

test('includes partner assets in the timeline', async ({ data, router, render, settle, api }) => {
  const person = factory.person({ name: 'Alice' });

  await showPerson({ data, router, render, settle }, person);

  expect(api.getTimeBuckets).toHaveBeenCalledWith({
    params: { visibility: 'timeline', personId: person.id, withPartners: true },
  });
});

test('sets the birth date', async ({ data, router, render, settle, api, app }) => {
  const person = factory.person({ name: 'Alice' });
  await showPerson({ data, router, render, settle }, person);

  await app.person.menuButton.click();
  await app.person.menuItem('edit_person').click();
  await app.person.birthDateSegments.first().click();
  await userEvent.keyboard('03151990');
  await app.dialogButton('submit').click();
  await settle();

  expect(api.updatePerson).toHaveBeenCalledWith({
    params: { id: person.id },
    body: { name: 'Alice', birthDate: expect.stringMatching(/^1990-03-15/) },
  });
});

test('clears the birth date', async ({ data, router, render, settle, api, app }) => {
  const person = factory.person({ name: 'Alice', birthDate: '1990-03-15' });
  await showPerson({ data, router, render, settle }, person);

  await app.person.menuButton.click();
  await app.person.menuItem('edit_person').click();
  await app.person.birthDateSegments.first().click();
  await userEvent.keyboard('{Backspace}{Backspace}{Backspace}');
  await app.dialogButton('submit').click();
  await settle();

  expect(api.updatePerson).toHaveBeenCalledWith({
    params: { id: person.id },
    body: { name: 'Alice', birthDate: null },
  });
});

test('clearing the name saves null', async ({ data, router, render, settle, api, app }) => {
  const person = factory.person({ name: 'Alice' });
  await showPerson({ data, router, render, settle }, person);

  app.person.openNameEditor();
  await app.person.nameInput.fill('');
  await userEvent.keyboard('{Enter}');
  await settle();

  expect(api.updatePerson).toHaveBeenCalledWith({ params: { id: person.id }, body: { name: null } });
});

test('clearing the name in the edit dialog saves null', async ({ data, router, render, settle, api, app }) => {
  const person = factory.person({ name: 'Alice' });
  await showPerson({ data, router, render, settle }, person);

  await app.person.menuButton.click();
  await app.person.menuItem('edit_person').click();
  await app.person.editNameInput.fill('');
  await app.dialogButton('submit').click();
  await settle();

  expect(api.updatePerson).toHaveBeenCalledWith({ params: { id: person.id }, body: { name: null, birthDate: null } });
});

test('hiding the person goes back', async ({ data, router, render, settle, api, app }) => {
  const person = factory.person({ name: 'Alice' });
  await showPerson({ data, router, render, settle }, person);

  await app.person.menuButton.click();
  await app.person.menuItem('hide_person').click();
  await settle();

  expect(api.updatePerson).toHaveBeenCalledWith({ params: { id: person.id }, body: { isHidden: true } });
  expect(router.url.pathname).toBe('/explore');
});

test('shows a hidden person and stays on the page', async ({ data, router, render, settle, api, app }) => {
  const person = factory.person({ name: 'Alice', isHidden: true });
  await showPerson({ data, router, render, settle }, person);

  await app.person.menuButton.click();
  await app.person.menuItem('unhide_person').click();
  await settle();

  expect(api.updatePerson).toHaveBeenCalledWith({ params: { id: person.id }, body: { isHidden: false } });
  expect(router.url.pathname).toBe(`/people/${person.id}`);
});

test('favorites the person', async ({ data, router, render, settle, api, app }) => {
  const person = factory.person({ name: 'Alice' });
  await showPerson({ data, router, render, settle }, person);

  await app.person.menuButton.click();
  await app.person.menuItem('to_favorite').click();
  await settle();

  expect(api.updatePerson).toHaveBeenCalledWith({ params: { id: person.id }, body: { isFavorite: true } });
  await expect.element(app.toast('added_to_favorites')).toBeVisible();
});

test('offers unfavorite after favoriting', async ({ data, router, render, settle, api, app }) => {
  const person = factory.person({ name: 'Alice' });
  await showPerson({ data, router, render, settle }, person);
  await app.person.menuButton.click();
  await app.person.menuItem('to_favorite').click();
  await settle();
  expect(api.updatePerson).toHaveBeenCalledWith({ params: { id: person.id }, body: { isFavorite: true } });
  onTestFinished(() => userEvent.keyboard('{Escape}'));

  await app.person.menuButton.click();

  await expect.element(app.person.menuItem('unfavorite')).toBeVisible();
});

test('unfavorites the person', async ({ data, router, render, settle, api, app }) => {
  const person = factory.person({ name: 'Alice', isFavorite: true });
  await showPerson({ data, router, render, settle }, person);

  await app.person.menuButton.click();
  await app.person.menuItem('unfavorite').click();
  await settle();

  expect(api.updatePerson).toHaveBeenCalledWith({ params: { id: person.id }, body: { isFavorite: false } });
});

test('shows an error when favoriting fails', async ({ data, router, render, settle, api, app, logger }) => {
  const person = factory.person({ name: 'Alice' });
  api.on({ updatePerson: () => ({ status: 500, json: { message: 'Server error', statusCode: 500 } }) });
  await showPerson({ data, router, render, settle }, person);

  await app.person.menuButton.click();
  await app.person.menuItem('to_favorite').click();
  await settle();

  expect(api.updatePerson).toHaveBeenCalledWith({ params: { id: person.id }, body: { isFavorite: true } });
  expect(logger.error).toHaveBeenCalledWith(/handleError/);
  await expect.element(app.toast('Server error\n(Immich Server Error)')).toBeVisible();
  await expect.element(app.toast('added_to_favorites')).not.toBeInTheDocument();
});

test('shows a readable error when favoriting fails without a server message', async ({
  data,
  router,
  render,
  settle,
  api,
  app,
  logger,
}) => {
  const person = factory.person({ name: 'Alice' });
  api.on({ updatePerson: () => ({ status: 500, body: '' }) });
  await showPerson({ data, router, render, settle }, person);

  await app.person.menuButton.click();
  await app.person.menuItem('to_favorite').click();
  await settle();

  expect(api.updatePerson).toHaveBeenCalledWith({ params: { id: person.id }, body: { isFavorite: true } });
  expect(logger.error).toHaveBeenCalledWith(/handleError/);
  await expect.element(app.toast('errors.unable_to_change_favorite')).toBeVisible();
});

test('merges a selected person into this person', async ({ data, router, render, settle, api, app }) => {
  const person = factory.person({ name: 'Alice' });
  const bob = factory.person({ name: 'Bob' });
  data.addPeople([bob, factory.person({ name: 'Carol' })]);
  await showPerson({ data, router, render, settle }, person);

  await app.person.menuButton.click();
  await app.person.menuItem('merge_people').click();
  await app.person.face('Bob').click();
  await app.person.mergeButton.click();
  await app.confirmButton.click();
  await settle();

  expect(api.mergePeople).toHaveBeenCalledWith({ body: { ids: [person.id, bob.id] } });
});

test('cancelling the merge confirmation merges nothing', async ({ data, router, render, settle, api, app }) => {
  const person = factory.person({ name: 'Alice' });
  data.addPeople(factory.person({ name: 'Bob' }));
  await showPerson({ data, router, render, settle }, person);

  await app.person.menuButton.click();
  await app.person.menuItem('merge_people').click();
  await app.person.face('Bob').click();
  await app.person.mergeButton.click();
  await app.cancelButton.click();
  await settle();

  expect(api.mergePeople).not.toHaveBeenCalled();
});

test('swapping the merge direction opens the other person', async ({ data, router, render, settle, api, app }) => {
  const person = factory.person({ name: 'Alice' });
  const bob = factory.person({ name: 'Bob' });
  data.addPeople(bob);
  await showPerson({ data, router, render, settle }, person);

  await app.person.menuButton.click();
  await app.person.menuItem('merge_people').click();
  await app.person.face('Bob').click();
  await app.person.swapMergeDirectionButton.click();

  expect(router.url.pathname).toBe(`/people/${bob.id}`);
  expect(router.url.searchParams.get('action')).toBe('merge');
  expect(api.mergePeople).not.toHaveBeenCalled();
});

test('merging an unnamed person opens the named one', async ({ data, router, render, settle, app }) => {
  const person = factory.person({ name: '' });
  const bob = factory.person({ name: 'Bob' });
  data.addPeople(bob);
  await showPerson({ data, router, render, settle }, person);

  await app.person.menuButton.click();
  await app.person.menuItem('merge_people').click();
  await app.person.face('Bob').click();

  expect(router.url.pathname).toBe(`/people/${bob.id}`);
});

test('reassigns selected assets to a new person', async ({ data, router, render, settle, api, app }) => {
  const person = factory.person({ name: 'Alice' });
  const asset = factory.personAsset(person);
  data.addAssets(asset);
  await showPerson({ data, router, render, settle }, person);

  await app.gallery.selectAll();
  await app.person.selectionMenuButton.click();
  await app.person.menuItem('fix_incorrect_match').click();
  await app.person.createNewPersonButton.click();
  await settle();

  const created = data.getPeople().find(({ id }) => id !== person.id);
  expect(api.createPerson).toHaveBeenCalledWith({ body: {} });
  expect(api.reassignFaces).toHaveBeenCalledWith({
    params: { id: created?.id },
    body: { data: [{ assetId: asset.id, personId: person.id }] },
  });
});

test('reassigns selected assets to an existing person', async ({ data, router, render, settle, api, app }) => {
  const person = factory.person({ name: 'Alice' });
  const bob = factory.person({ name: 'Bob' });
  const asset = factory.personAsset(person);
  data.addAssets(asset).addPeople(bob);
  await showPerson({ data, router, render, settle }, person);

  await app.gallery.selectAll();
  await app.person.selectionMenuButton.click();
  await app.person.menuItem('fix_incorrect_match').click();
  await app.person.face('Bob').click();
  await app.person.reassignButton.click();
  await settle();

  expect(api.reassignFaces).toHaveBeenCalledWith({
    params: { id: bob.id },
    body: { data: [{ assetId: asset.id, personId: person.id }] },
  });
  expect(api.createPerson).not.toHaveBeenCalled();
  expect(api.getPersonStatistics.calls).toHaveLength(2);
});

test('grants a cluster group user access', async ({ data, router, render, settle, api, app }) => {
  const person = factory.person({ name: 'Alice' });
  const bob = factory.user({ name: 'Bob', clusterGroupId: data.user.clusterGroupId });
  data.addUsers(bob);
  await showPerson({ data, router, render, settle }, person);
  await app.person.access.openButton.click();
  await settle();

  await app.person.access.addUserButton.click();
  await app.userPicker.user('Bob').click();
  await app.userPicker.addButton.click();
  await settle();

  expect(api.upsertPeopleUsers).toHaveBeenCalledWith({
    body: { personIds: [person.id], sharedWithIds: [bob.id], role: PersonUserRole.Admin },
  });
  await expect.element(app.person.access.removeButton).toBeVisible();
  await app.person.access.closeButton.click();
});

test('removes a user from the person', async ({ data, router, render, settle, api, app }) => {
  const person = factory.person({ name: 'Alice' });
  const bob = factory.user({ name: 'Bob' });
  data.addUsers(bob);
  data.sharePerson(person.id, data.user.id, bob.id);
  await showPerson({ data, router, render, settle }, person);
  await app.person.access.openButton.click();
  await settle();

  await app.person.access.removeButton.click();
  await settle();

  expect(api.removeUsersFromPeople).toHaveBeenCalledWith({ body: [{ personId: person.id, sharedWithId: bob.id }] });
  await expect.element(app.person.access.user('Bob')).not.toBeInTheDocument();
  await app.person.access.closeButton.click();
});

test('shares the person back with the user who shared it', async ({ data, router, render, settle, api, app }) => {
  const person = factory.person({ name: 'Alice' });
  const bob = factory.user({ name: 'Bob' });
  data.addUsers(bob);
  data.sharePerson(person.id, bob.id, data.user.id);
  await showPerson({ data, router, render, settle }, person);
  await app.person.access.openButton.click();
  await settle();

  await app.person.access.shareBackButton.click();
  await settle();

  expect(api.upsertPeopleUsers).toHaveBeenCalledWith({
    body: { personIds: [person.id], sharedWithIds: [bob.id], role: PersonUserRole.Admin },
  });
  expect(api.removeUsersFromPeople).not.toHaveBeenCalled();
  await expect.element(app.person.access.removeButton).toBeVisible();
  await app.person.access.closeButton.click();
});

test('keeps a typed name when renamed elsewhere', async ({ data, router, render, settle, api, app }) => {
  const person = factory.person({ name: 'Ariel' });
  await showPerson({ data, router, render, settle }, person);
  app.person.openNameEditor();
  await app.person.nameInput.fill('Ariel typed');
  await settle();

  data.updatePerson(person.id, { name: 'Ariel remote' });
  await queryClient.invalidateQueries({ queryKey: getPersonQuery(person.id).queryKey });
  await settle();

  await expect.element(app.person.nameInput).toHaveValue('Ariel typed');
  await userEvent.keyboard('{Enter}');
  await settle();
  expect(api.updatePerson).toHaveBeenCalledWith({ params: { id: person.id }, body: { name: 'Ariel typed' } });
});
