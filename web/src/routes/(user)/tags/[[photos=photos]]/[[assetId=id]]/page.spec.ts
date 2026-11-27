import { queryClient } from '#lib/queries/client.ts';
import { Route } from '#lib/route.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import PageHost from '#test/unit/mocks/PageHost.svelte';
import { setPage } from '#test/unit/mocks/app-state.svelte.ts';
import { expect, onTestFinished } from 'vitest';
import { render as renderComponent } from 'vitest-browser-svelte';
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

test('switching tags while loading clears old tag assets and does not mix timelines', async ({
  data,
  router,
  settle,
  app,
  api,
}) => {
  const style = document.createElement('style');
  style.textContent = '#asset-grid { width: 1000px; height: 800px; }';
  document.head.append(style);
  onTestFinished(() => style.remove());

  const travel = factory.tag({ name: 'Travel' });
  const food = factory.tag({ name: 'Food' });
  const travelAsset = factory.asset({
    originalFileName: 'travel-photo.jpg',
    fileCreatedAt: '1965-12-15T12:00:00.000Z',
    localDateTime: '1965-12-15T12:00:00.000Z',
    tags: [travel],
  });
  const foodAsset = factory.asset({
    originalFileName: 'food-photo.jpg',
    fileCreatedAt: '1975-12-15T12:00:00.000Z',
    localDateTime: '1975-12-15T12:00:00.000Z',
    tags: [food],
  });
  data.addTags([travel, food]).addAssets([travelAsset, foodAsset]);

  const bucketByTagId = new Map([
    [travel.id, '1965-12'],
    [food.id, '1975-12'],
  ]);

  let releaseTravelBucket!: () => void;
  const travelBucketStarted = new Promise<void>((resolveStarted) => {
    api.on({
      getTimeBuckets: ({ params = {} }) => {
        const prefix = params.tagId ? bucketByTagId.get(params.tagId) : undefined;
        return {
          json: data.timeBuckets(params).filter((bucket) => !prefix || bucket.timeBucket.startsWith(prefix)),
        };
      },
      getTimeBucket: async ({ params }) => {
        if (params.tagId === travel.id) {
          resolveStarted();
          await new Promise<void>((resolve) => {
            releaseTravelBucket = resolve;
          });
        }
        return { json: data.timeBucket(params.timeBucket, params) };
      },
    });
  });

  const loadTagData = async (path: string) => {
    await router.goto(Route.tags({ path }));
    const tagData = await load({
      url: router.url,
      params: router.params,
      route: { id: null },
      fetch,
      data: null,
      parent: () => Promise.resolve({}),
      depends: () => {},
      untrack: <T>(fn: () => T) => fn(),
    } as never);
    setPage({ url: router.url, params: router.params, data: tagData as Record<string, unknown>, status: 200 });
    return tagData;
  };

  const travelData = await loadTagData('Travel');
  const { rerender } = await renderComponent(PageHost, {
    component: Page as never,
    data: travelData,
    params: router.params,
    client: queryClient,
  });
  await travelBucketStarted;

  const foodData = await loadTagData('Food');
  await rerender({
    component: Page as never,
    data: foodData,
    params: router.params,
    client: queryClient,
  });
  await expect.element(app.gallery.thumbnail(foodAsset)).toBeInTheDocument();
  await expect.element(app.gallery.thumbnail(travelAsset)).not.toBeInTheDocument();

  releaseTravelBucket();
  await settle();

  await expect.element(app.gallery.thumbnail(foodAsset)).toBeInTheDocument();
  await expect.element(app.gallery.thumbnail(travelAsset)).not.toBeInTheDocument();
});
