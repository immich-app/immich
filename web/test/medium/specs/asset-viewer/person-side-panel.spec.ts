import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test('deletes a face', async ({ page, data, api, app }) => {
  const asset = factory.asset({ width: 4000, height: 3000 });
  const alice = factory.person({ name: 'Alice Johnson' });
  const face = factory.face({ person: alice });
  data.addAssets(asset).addPeople(alice).addFaces(asset.id, face);
  await page.goto(Route.viewAsset({ id: asset.id }));
  await app.viewer.waitForAsset(asset);
  await app.viewer.openDetailPanel();
  await app.viewer.editPeopleButton.click();

  await app.viewer.deleteFaceButton.click();
  await app.dialogButton('cancel').click();
  await expect(app.dialog).toBeHidden();
  expect(api.deleteFace).not.toHaveBeenCalled();

  await app.viewer.deleteFaceButton.click();
  await app.dialogButton('confirm').click();

  await expect.poll(() => api.deleteFace.calls.length).toBe(1);
  expect(api.deleteFace).toHaveBeenCalledWith({ params: { id: face.id }, body: { force: false } });
});

test('a deleted face is no longer listed in the detail panel', async ({ page, data, api, app }) => {
  const asset = factory.asset({ width: 4000, height: 3000 });
  const alice = factory.person({ name: 'Alice Johnson' });
  const bob = factory.person({ name: 'Bob Smith' });
  const face = factory.face({ person: alice });
  data
    .addAssets(asset)
    .addPeople([alice, bob])
    .addFaces(asset.id, [face, factory.face({ person: bob })]);
  await page.goto(Route.viewAsset({ id: asset.id }));
  await app.viewer.waitForAsset(asset);
  await app.viewer.openDetailPanel();
  await expect(app.viewer.personThumbnail(alice.name)).toBeVisible();
  await app.viewer.editPeopleButton.click();

  await app.viewer.deleteFaceButton.first().click();
  await app.dialogButton('confirm').click();
  await app.viewer.editFacesDoneButton.click();

  await expect(app.viewer.personThumbnail(bob.name)).toBeVisible();
  await expect(app.viewer.personThumbnail(alice.name)).toHaveCount(0);
  expect(api.deleteFace).toHaveBeenCalledWith({ params: { id: face.id }, body: { force: false } });
});

test('reassigns a face to another person', async ({ page, data, api, app }) => {
  const asset = factory.asset({ width: 4000, height: 3000 });
  const alice = factory.person({ name: 'Alice Johnson' });
  const bob = factory.person({ name: 'Bob Smith' });
  const face = factory.face({ person: alice });
  data.addAssets(asset).addPeople([alice, bob]).addFaces(asset.id, face);
  await page.goto(Route.viewAsset({ id: asset.id }));
  await app.viewer.waitForAsset(asset);
  await app.viewer.openDetailPanel();
  await app.viewer.editPeopleButton.click();
  await app.viewer.selectNewFaceButton.click();
  await app.viewer.facePickerPerson('Bob Smith').click();

  await app.viewer.editFacesDoneButton.click();

  await expect.poll(() => api.reassignFacesById.calls.length).toBe(1);
  expect(api.reassignFacesById).toHaveBeenCalledWith({ params: { id: bob.id }, body: { id: face.id } });
  expect(api.getAllPeople).toHaveBeenCalledWith({ params: { withHidden: true, closestAssetId: face.id } });
  expect(api.createPerson).not.toHaveBeenCalled();
});

test('reassigns a face to a person found by name', async ({ page, data, api, app }) => {
  const asset = factory.asset({ width: 4000, height: 3000 });
  const alice = factory.person({ name: 'Alice Johnson' });
  const bob = factory.person({ name: 'Bob Smith' });
  const face = factory.face({ person: alice });
  data.addAssets(asset).addPeople([alice, bob]).addFaces(asset.id, face);
  await page.goto(Route.viewAsset({ id: asset.id }));
  await app.viewer.waitForAsset(asset);
  await app.viewer.openDetailPanel();
  await app.viewer.editPeopleButton.click();
  await app.viewer.selectNewFaceButton.click();
  await app.viewer.searchExistingPersonButton.click();
  await app.viewer.facePickerSearch.fill('bob');
  await app.viewer.facePickerPerson('Bob Smith').click();

  await app.viewer.editFacesDoneButton.click();

  await expect.poll(() => api.reassignFacesById.calls.length).toBe(1);
  expect(api.searchPerson).toHaveBeenCalledWith({ params: { name: 'bob' } });
  expect(api.reassignFacesById).toHaveBeenCalledWith({ params: { id: bob.id }, body: { id: face.id } });
});

test('assigns a face to a new person', async ({ page, data, api, app }) => {
  const asset = factory.asset({ width: 4000, height: 3000 });
  const alice = factory.person({ name: 'Alice Johnson' });
  const face = factory.face({ person: alice });
  data.addAssets(asset).addPeople(alice).addFaces(asset.id, face);
  await page.goto(Route.viewAsset({ id: asset.id }));
  await app.viewer.waitForAsset(asset);
  await app.viewer.openDetailPanel();
  await app.viewer.editPeopleButton.click();
  await app.viewer.selectNewFaceButton.click();
  await app.viewer.createNewPersonButton.click();

  await app.viewer.editFacesDoneButton.click();

  await expect.poll(() => api.reassignFacesById.calls.length).toBe(1);
  const created = data.getPeople().find(({ id }) => id !== alice.id);
  expect(api.createPerson).toHaveBeenCalledWith({ body: {} });
  expect(api.reassignFacesById).toHaveBeenCalledWith({ params: { id: created?.id }, body: { id: face.id } });
});
