import { Route } from '#lib/route.ts';
import type { MockData } from '#test/common/data.ts';
import { factory } from '#test/common/factories.ts';
import type { App } from '#test/medium/app.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { SharedLinkType } from '@immich/sdk';

const setup = (data: MockData) => {
  const asset = factory.asset();
  const link = factory.sharedLink({
    type: SharedLinkType.Individual,
    assets: [asset, factory.asset()],
    showMetadata: false,
  });
  data.addSharedLinks(link);
  return { asset, link };
};

const expectActions = async (app: App, names: string[]) => {
  const buttons = app.viewer.navbarActions.getByRole('button');
  await expect(buttons).toHaveCount(names.length);
  expect(
    await buttons.evaluateAll((elements) => elements.map((element) => element.getAttribute('aria-label'))),
  ).toEqual(names);
};

test.describe('asset viewer navbar on a shared link without metadata', () => {
  test('shows guest actions', async ({ page, context, data, app }) => {
    const { asset, link } = setup(data);
    await context.clearCookies();
    await page.goto(`${Route.viewSharedLink({ key: link.key })}/photos/${asset.id}`);
    await app.viewer.waitForAsset(asset);

    await expectActions(app, ['zoom_image', 'copy_image', 'download']);
  });

  test('shows owner actions', async ({ page, data, app }) => {
    const { asset, link } = setup(data);
    await page.goto(`${Route.viewSharedLink({ key: link.key })}/photos/${asset.id}`);
    await app.viewer.waitForAsset(asset);

    await expectActions(app, ['share', 'zoom_image', 'copy_image', 'download', 'to_favorite', 'delete']);
  });
});

test.describe('asset viewer navbar on a shared link without downloads', () => {
  const setupNoDownload = (data: MockData) => {
    const asset = factory.asset();
    const link = factory.sharedLink({
      type: SharedLinkType.Individual,
      assets: [asset, factory.asset()],
      allowDownload: false,
    });
    data.addSharedLinks(link);
    return { asset, link };
  };

  test('hides download from a guest', async ({ page, context, data, app }) => {
    const { asset, link } = setupNoDownload(data);
    await context.clearCookies();
    await page.goto(`${Route.viewSharedLink({ key: link.key })}/photos/${asset.id}`);
    await app.viewer.waitForAsset(asset);

    await expect(app.viewer.navbarActions.getByLabel('download', { exact: true })).toHaveCount(0);
  });

  test('still shows download to the owner', async ({ page, data, app }) => {
    const { asset, link } = setupNoDownload(data);
    await page.goto(`${Route.viewSharedLink({ key: link.key })}/photos/${asset.id}`);
    await app.viewer.waitForAsset(asset);

    await expect(app.viewer.navbarActions.getByLabel('download', { exact: true })).toBeVisible();
  });
});

test.describe('asset viewer navbar for the owner', () => {
  test('shows the back button and move to trash on /photos/:id', async ({ page, data, app }) => {
    const asset = factory.asset();
    data.addAssets(asset);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);

    await expect(app.viewer.backButton).toBeVisible();
    await expect(app.viewer.deleteButton).toBeVisible();
    await expect(app.viewer.permanentlyDeleteButton).toHaveCount(0);
  });

  test('shows permanently delete for a trashed asset opened from /trash', async ({ page, data, app }) => {
    const asset = factory.asset({ isTrashed: true });
    data.addAssets(asset);
    await page.goto(Route.trash());

    await app.timeline.thumbnail(asset).click();
    await app.viewer.waitForAsset(asset);

    await expect(app.viewer.permanentlyDeleteButton).toBeVisible();
    await expect(app.viewer.deleteButton).toHaveCount(0);
  });
});
