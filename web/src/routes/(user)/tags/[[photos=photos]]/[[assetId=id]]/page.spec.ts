import { Route } from '#lib/route.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect } from 'vitest';
import Page from './+page.svelte';
import { load } from './+page.ts';

test('creating a tag under the current tag shows it as a child', async ({ data, router, render, settle, app, api }) => {
  data.addTags(factory.tag({ name: 'Travel' }));
  await router.goto(Route.tags({ path: 'Travel' }));
  await render(Page, load);
  await settle();

  await app.tags.createButton.click();
  await app.tags.form.tagInput.fill('Japan');
  await app.tags.form.createButton.click();
  await settle();

  expect(api.upsertTags).toHaveBeenCalledWith({ body: { tags: ['Travel/Japan'] } });
  await expect.element(app.tags.child('Japan')).toBeVisible();
});

test('renaming the current tag opens its new path', async ({ data, router, render, settle, app, api }) => {
  const travel = factory.tag({ name: 'Travel' });
  data.addTags(travel);
  await router.goto(Route.tags({ path: 'Travel' }));
  await render(Page, load);
  await settle();

  await app.tags.editButton.click();
  await app.tags.form.nameInput.fill('Trips');
  await app.tags.form.saveButton.click();
  await settle();

  expect(api.updateTag).toHaveBeenCalledWith({ params: { id: travel.id }, body: { name: 'Trips', color: null } });
  expect(router.url.href).toBe(new URL(Route.tags({ path: 'Trips' }), router.url).href);
  await expect.element(app.tags.explorerLink('Trips')).toBeVisible();
});

test('deleting the current tag opens its parent', async ({ data, router, render, settle, app, api }) => {
  const travel = factory.tag({ name: 'Travel' });
  const japan = factory.tag({ name: 'Japan', value: 'Travel/Japan', parentId: travel.id });
  data.addTags([travel, japan]);
  await router.goto(Route.tags({ path: 'Travel/Japan' }));
  await render(Page, load);
  await settle();

  await app.tags.deleteButton.click();
  await app.cancelButton.click();
  await settle();

  expect(api.deleteTag).not.toHaveBeenCalled();

  await app.tags.deleteButton.click();
  await app.tags.form.deleteButton.click();
  await settle();

  expect(api.deleteTag).toHaveBeenCalledWith({ params: { id: japan.id } });
  expect(router.url.href).toBe(new URL(Route.tags({ path: 'Travel' }), router.url).href);
  await expect.element(app.tags.explorerLink('Japan')).not.toBeInTheDocument();
});
