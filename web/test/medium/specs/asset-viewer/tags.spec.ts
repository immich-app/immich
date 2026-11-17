import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test.describe('detail panel tags', () => {
  test.beforeEach(({ data }) => {
    data.setPreferences(factory.preferences({ tags: { enabled: true, sidebarWeb: false } }));
  });

  test('tagging with an existing tag shows it in the panel', async ({ page, data, api, app }) => {
    const travel = factory.tag({ name: 'Travel' });
    const asset = factory.asset();
    data.addTags(travel).addAssets(asset);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);
    await app.viewer.openDetailPanel();

    await app.viewer.addTagButton.click();
    await app.viewer.tagAssets.pick('Travel');
    await app.viewer.tagAssets.submitButton.click();

    await expect(app.viewer.tag('Travel')).toBeVisible();
    expect(api.upsertTags).not.toHaveBeenCalled();
    expect(api.bulkTagAssets).toHaveBeenCalledWith({ body: { assetIds: [asset.id], tagIds: [travel.id] } });
  });

  test('tagging with a new tag creates it and shows it in the panel', async ({ page, data, api, app }) => {
    const asset = factory.asset();
    data.addAssets(asset);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);
    await app.viewer.openDetailPanel();

    await app.viewer.addTagButton.click();
    await app.viewer.tagAssets.pick('Japan');
    await app.viewer.tagAssets.submitButton.click();

    await expect(app.viewer.tag('Japan')).toBeVisible();
    expect(api.upsertTags).toHaveBeenCalledWith({ body: { tags: ['Japan'] } });
    const [japan] = data.tagList();
    expect(api.bulkTagAssets).toHaveBeenCalledWith({ body: { assetIds: [asset.id], tagIds: [japan.id] } });
  });

  test('removing a tag drops it from the panel', async ({ page, data, api, app }) => {
    const travel = factory.tag({ name: 'Travel' });
    const asset = factory.asset({ tags: [travel] });
    data.addTags(travel).addAssets(asset);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);
    await app.viewer.openDetailPanel();
    await expect(app.viewer.tag('Travel')).toBeVisible();

    await app.viewer.removeTagButton.click();

    await expect(app.viewer.tag('Travel')).not.toBeVisible();
    expect(api.untagAssets).toHaveBeenCalledWith({ params: { id: travel.id }, body: { ids: [asset.id] } });
  });
});
