import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test('album page goes to the album list when the album is deleted elsewhere', async ({ page, data, api, app }) => {
  const album = factory.album();
  data.addAlbums(album);
  await page.goto(Route.viewAlbum(album));
  await expect(app.album.selectPhotosButton).toBeVisible();

  data.deleteAlbum(album.id);
  await api.emitResourceEvent({ deleted: [`/albums/${album.id}`] });

  await expect(app.albums.createAlbumButton).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(Route.albums());
  expect(api.getAlbumInfo.calls).toHaveLength(1);
});

test('person page goes to the people list when the person is merged elsewhere', async ({ page, data, api, app }) => {
  const [alice, bob] = [factory.person({ name: 'Alice' }), factory.person({ name: 'Bob' })];
  data.addPeople([alice, bob]);
  await page.goto(Route.viewPerson(bob));
  await expect(app.person.editNameButton).toBeVisible();

  data.mergePeople([alice.id, bob.id]);
  await api.emitResourceEvent({ deleted: [`/people/${bob.id}`] });

  await expect(app.people.thumbnail('Alice')).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(Route.people());
  expect(api.getPerson.calls).toHaveLength(1);
});

test('workflow page goes to the workflow list when the workflow is deleted elsewhere', async ({
  page,
  data,
  api,
  app,
}) => {
  const workflow = factory.workflow();
  data.addWorkflows(workflow);
  await page.goto(Route.viewWorkflow(workflow));
  await expect(app.workflow.nameInput).toBeVisible();

  data.deleteWorkflow(workflow.id);
  await api.emitResourceEvent({ deleted: [`/workflows/${workflow.id}`] });

  await expect(app.workflows.emptyPlaceholder).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(Route.workflows());
});
