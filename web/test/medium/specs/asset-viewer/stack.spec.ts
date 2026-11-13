import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test.describe('stack', () => {
  test('stack strip lists the stack and the detail panel follows the selected asset', async ({ page, data, app }) => {
    const primary = factory.asset({ tags: [factory.tag({ name: '1', value: 'test/1' })] });
    const second = factory.asset({ tags: [factory.tag({ name: '2', value: 'test/2' })] });
    data
      .addStacks(factory.stack({ assets: [primary, second] }))
      .setPreferences(factory.preferences({ tags: { enabled: true, sidebarWeb: false } }));
    await page.goto(Route.viewAsset({ id: primary.id }));
    await app.viewer.waitForAsset(primary);

    await expect(app.viewer.stack).toBeVisible();
    await expect(app.viewer.stackAssets).toHaveCount(2);

    await app.viewer.openDetailPanel();
    await expect(app.viewer.tags.first()).toHaveText('test/1');

    await app.viewer.stackThumbnail(second).click();
    await expect(app.viewer.tags.first()).toHaveText('test/2');
  });

  test('stack strip is hidden during a slideshow', async ({ page, data, app }) => {
    const [primary, second] = [factory.asset(), factory.asset()];
    data.addStacks(factory.stack({ assets: [primary, second] }));
    await page.goto(Route.viewAsset({ id: primary.id }));
    await app.viewer.waitForAsset(primary);
    await expect(app.viewer.stack).toBeVisible();

    await app.viewer.openSlideshow();

    await expect(app.viewer.exitSlideshowButton).toBeVisible();
    await expect(app.viewer.stack).not.toBeVisible();
  });

  test('stacking selected assets from the timeline', async ({ page, data, api, app }) => {
    const [first, second] = [factory.asset(), factory.asset()];
    data.addAssets([first, second]);
    await page.goto(Route.photos());
    await app.timeline.select(first);
    await app.timeline.select(second);

    await app.timeline.selectionBar.stack();

    expect(api.createStack).toHaveBeenCalledWith({ body: { assetIds: [first.id, second.id] } });
    await expect(app.toast('stacked_assets_count')).toBeVisible();
    await expect(app.timeline.selected).toHaveCount(0);
  });

  test('unstacking selected assets from the timeline', async ({ page, data, api, app }) => {
    const stack = factory.stack({ assets: [factory.asset(), factory.asset()] });
    data.addStacks(stack);
    await page.goto(Route.photos());
    await app.timeline.select(stack.assets[0]);

    await app.timeline.selectionBar.unstack();

    expect(api.deleteStacks).toHaveBeenCalledWith({ body: { ids: [stack.id] } });
    await expect(app.toast('unstacked_assets_count')).toBeVisible();
    await expect(app.timeline.selected).toHaveCount(0);
  });

  test('unstacking from the viewer closes it', async ({ page, data, api, app }) => {
    const stack = factory.stack({ assets: [factory.asset(), factory.asset()] });
    data.addStacks(stack);
    await page.goto(Route.viewAsset({ id: stack.assets[0].id }));
    await app.viewer.waitForAsset(stack.assets[0]);

    await app.viewer.unstack();

    expect(api.deleteStacks).toHaveBeenCalledWith({ body: { ids: [stack.id] } });
    await expect(app.toast('unstacked_assets_count')).toBeVisible();
    await expect(app.viewer.root).not.toBeVisible();
  });

  test('removing an asset from the stack drops it from the strip', async ({ page, data, api, app }) => {
    const stack = factory.stack({ assets: [factory.asset(), factory.asset(), factory.asset()] });
    data.addStacks(stack);
    const removed = stack.assets[1];
    await page.goto(Route.viewAsset({ id: removed.id }));
    await app.viewer.waitForAsset(removed);

    await app.viewer.removeFromStack();

    expect(api.removeAssetFromStack).toHaveBeenCalledWith({ params: { id: stack.id, assetId: removed.id } });
    await expect(app.toast('removed_from_stack')).toBeVisible();
    await expect(app.viewer.stackAssets).toHaveCount(2);
    await expect(app.viewer.stackThumbnail(removed)).toHaveCount(0);
  });

  test('an asset removed from a stack has no stack icon back on the timeline', async ({ page, data, api, app }) => {
    const stack = factory.stack({ assets: [factory.asset(), factory.asset(), factory.asset()] });
    data.addStacks(stack);
    const [primary, removed] = stack.assets;
    await page.goto(Route.photos());
    await app.timeline.thumbnail(primary).click();
    await app.viewer.waitForAsset(primary);
    await app.viewer.stackThumbnail(removed).click();
    await app.viewer.waitForAsset(removed);

    await app.viewer.removeFromStack();
    expect(api.removeAssetFromStack).toHaveBeenCalledWith({ params: { id: stack.id, assetId: removed.id } });
    await app.viewer.backButton.click();

    await expect(app.viewer.root).not.toBeVisible();
    await expect(app.timeline.thumbnail(removed)).toBeVisible();
    await expect(app.timeline.stackIcon(removed)).toHaveCount(0);
    await expect(app.timeline.stackIcon(primary)).toHaveText('2');
  });

  test('setting the primary asset of a stack', async ({ page, data, api, app }) => {
    const stack = factory.stack({ assets: [factory.asset(), factory.asset()] });
    data.addStacks(stack);
    const second = stack.assets[1];
    await page.goto(Route.viewAsset({ id: second.id }));
    await app.viewer.waitForAsset(second);

    await app.viewer.setStackPrimary();

    expect(api.updateStack).toHaveBeenCalledWith({ params: { id: stack.id }, body: { primaryAssetId: second.id } });
    await app.viewer.moreButton.click();
    await expect(page.getByRole('menuitem', { name: 'set_stack_primary_asset', exact: true })).toHaveCount(0);
  });
});
