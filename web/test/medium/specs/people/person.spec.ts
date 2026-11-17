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

test('renaming to an accented existing name offers a merge', async ({ page, data, api, app }) => {
  const unnamed = factory.person({ name: '' });
  data.addPeople([factory.person({ name: 'Amélie' }), unnamed]);
  await page.goto(Route.viewPerson(unnamed));

  await app.person.editNameButton.click();
  await app.person.nameInput.fill('amelie');
  await app.person.doneButton.click();

  await expect(app.person.mergeDialog('Amélie')).toBeVisible();
  expect(api.updatePerson).not.toHaveBeenCalled();
});

test('swapping the merge suggestion shows the swapped faces', async ({ page, data, app }) => {
  const alice = factory.person({ name: 'Alice' });
  const unnamed = factory.person({ name: 'Unknown' });
  data.addPeople([alice, unnamed]);
  await page.goto(Route.viewPerson(unnamed));
  await app.person.editNameButton.click();
  await app.person.nameInput.fill('alice');
  await app.person.doneButton.click();

  await app.person.swapMergeDirectionButton.click();

  await expect(app.person.dialogThumbnail('Alice')).toHaveAttribute('src', new RegExp(alice.id));
  await expect(app.person.dialogThumbnail('Unknown')).toHaveAttribute('src', new RegExp(unnamed.id));
});

test('merging into the suggestion opens it without renaming', async ({ page, data, api, app }) => {
  const alice = factory.person({ name: 'Alice' });
  const unnamed = factory.person({ name: 'Unknown' });
  data.addPeople([alice, unnamed]);
  await page.goto(Route.viewPerson(unnamed));
  await app.person.editNameButton.click();
  await app.person.nameInput.fill('Alice');
  await app.person.doneButton.click();

  await app.dialogButton('yes').click();

  await expect(page).toHaveURL(new RegExp(`/people/${alice.id}`));
  expect(api.mergePeople).toHaveBeenCalledWith({ body: { ids: [alice.id, unnamed.id] } });
  expect(api.updatePerson).not.toHaveBeenCalled();
});

test('swapping the merge suggestion keeps the new name', async ({ page, data, api, app }) => {
  const alice = factory.person({ name: 'Alice' });
  const unnamed = factory.person({ name: 'Unknown' });
  data.addPeople([alice, unnamed]);
  await page.goto(Route.viewPerson(unnamed));
  await app.person.editNameButton.click();
  await app.person.nameInput.fill('Alice');
  await app.person.doneButton.click();
  await app.person.swapMergeDirectionButton.click();

  await app.dialogButton('yes').click();

  await expect.poll(() => api.updatePerson.calls.length).toBe(1);
  expect(api.mergePeople).toHaveBeenCalledWith({ body: { ids: [unnamed.id, alice.id] } });
  expect(api.updatePerson).toHaveBeenCalledWith({ params: { id: unnamed.id }, body: { name: 'Alice' } });
});

test('swapping the merge direction shows the swapped faces', async ({ page, data, app }) => {
  const alice = factory.person({ name: 'Alice' });
  const bob = factory.person({ name: 'Bob' });
  data.addPeople([alice, bob]);
  await page.goto(Route.viewPerson(alice, { action: 'merge' }));
  await app.person.face('Bob').click();

  await app.person.swapMergeDirectionButton.click();

  await expect(page).toHaveURL(new RegExp(`/people/${bob.id}`));
  await expect(app.person.thumbnail('Bob')).toHaveAttribute('src', new RegExp(bob.id));
  await expect(app.person.thumbnail('Alice')).toHaveAttribute('src', new RegExp(alice.id));
});

test('escape on the person details goes back', async ({ page, data, app }) => {
  const alice = factory.person({ name: 'Alice' });
  data.addPeople(alice);
  await page.goto(Route.viewPerson(alice, { previousRoute: Route.people() }));
  await expect(app.person.editNameButton).toBeVisible();

  await app.person.editNameButton.focus();
  await page.keyboard.press('Escape');

  await expect(page).toHaveURL(Route.people());
});

test('going back from an asset opened by url stays on the person', async ({ page, data, app }) => {
  const alice = factory.person({ name: 'Alice' });
  const asset = factory.personAsset(alice);
  data.addAssets(asset).addPeople(alice);
  await page.goto(`${Route.viewPerson(alice)}/photos/${asset.id}`);
  await app.viewer.waitForAsset(asset);
  await app.viewer.backButton.click();
  await expect(page).toHaveURL(`${Route.viewPerson(alice)}?at=${asset.id}`);

  await app.person.backButton.click();

  await expect(page).toHaveURL(Route.viewPerson(alice));
});

test('selects a featured photo from the timeline', async ({ page, data, api, app }) => {
  const alice = factory.person({ name: 'Alice' });
  const asset = factory.personAsset(alice);
  data.addAssets(asset).addPeople(alice);
  await page.goto(Route.viewPerson(alice));
  await app.person.menuButton.click();
  await app.person.menuItem('select_featured_photo').click();

  await app.person.asset(asset).click();

  await expect(app.toast('feature_photo_updated')).toBeVisible();
  expect(api.updatePerson).toHaveBeenCalledWith({ params: { id: alice.id }, body: { featureFaceAssetId: asset.id } });
});

test('refreshes the face once the new featured photo is ready', async ({ page, data, api, app }) => {
  const alice = factory.person({ name: 'Alice' });
  const asset = factory.personAsset(alice, { width: 4000, height: 3000 });
  data
    .addAssets(asset)
    .addPeople(alice)
    .addFaces(asset.id, factory.face({ person: alice }));
  await page.goto(`${Route.viewPerson(alice)}/photos/${asset.id}`);
  await app.viewer.waitForAsset(asset);
  await app.viewer.openDetailPanel();
  await app.viewer.setFeaturedPhoto();
  await expect.poll(() => api.updatePerson.calls.length).toBe(1);

  api.emit('on_person_thumbnail', alice.id);

  await expect(app.viewer.personThumbnail('Alice')).not.toHaveAttribute('src', /updatedAt=2025-01-01/);
  expect(api.updatePerson).toHaveBeenCalledWith({ params: { id: alice.id }, body: { featureFaceAssetId: asset.id } });
});
