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
