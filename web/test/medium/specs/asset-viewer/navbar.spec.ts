import { Route } from '#lib/route.ts';
import { expect, test, type MockData } from '#test/medium/fixtures.ts';
import { factory } from '#test/medium/mock/factories.ts';
import { SharedLinkType } from '@immich/sdk';
import type { Page } from '@playwright/test';

const setup = (data: MockData) => {
  const asset = factory.asset();
  const link = factory.sharedLink({
    type: SharedLinkType.Individual,
    assets: [asset, factory.asset()],
    showMetadata: false,
  });
  data.addSharedLink(link);
  return { asset, link };
};

const expectActions = async (page: Page, names: string[]) => {
  const buttons = page.getByTestId('asset-viewer-navbar-actions').getByRole('button');
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

    await expectActions(page, ['zoom_image', 'copy_image', 'download']);
  });

  test('shows owner actions', async ({ page, data, app }) => {
    const { asset, link } = setup(data);
    await page.goto(`${Route.viewSharedLink({ key: link.key })}/photos/${asset.id}`);
    await app.viewer.waitForAsset(asset);

    await expectActions(page, ['share', 'zoom_image', 'copy_image', 'download', 'to_favorite', 'delete']);
  });
});
