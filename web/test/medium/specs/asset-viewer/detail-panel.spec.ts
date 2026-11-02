import { Route } from '#lib/route.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { factory } from '#test/medium/mock/factories.ts';
import { SharedLinkType } from '@immich/sdk';

test.describe('detail panel', () => {
  test('description edits persist after closing and reopening the panel', async ({ page, data, api, app }) => {
    const asset = factory.asset();
    data.addAsset(asset);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);

    await app.viewer.infoButton.click();
    await app.viewer.description.fill('new description');
    await expect(app.viewer.description).toHaveValue('new description');

    await app.viewer.infoButton.click();
    await expect(app.viewer.description).not.toBeVisible();
    expect(api.updateAsset).toHaveBeenCalledWith({
      params: { id: asset.id },
      body: { description: 'new description' },
    });

    api.emit('on_asset_update', data.getAsset(asset.id));
    await app.viewer.infoButton.click();
    await expect(app.viewer.description).toHaveValue('new description');
  });

  test('date editor shows the asset timezone, not the first zone with the same offset', async ({ page, data, app }) => {
    const asset = factory.asset({
      fileCreatedAt: '2025-12-01T18:30:00.000Z',
      localDateTime: '2025-12-01T11:30:00.000Z',
      exifInfo: { dateTimeOriginal: '2025-12-01T18:30:00.000Z', timeZone: 'America/Denver' },
    });
    data.addAsset(asset);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);

    await app.viewer.infoButton.click();
    await app.viewer.editDateButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await expect(page.locator('#datetime')).toHaveValue('2025-12-01T11:30');
    await expect(page.getByRole('combobox', { name: 'timezone' })).toHaveValue('America/Denver (-07:00)');
  });

  test('opens on a shared link and stays closed when metadata is hidden', async ({ page, context, data, app }) => {
    const asset = factory.asset();
    const other = factory.asset();
    const visible = factory.sharedLink({ type: SharedLinkType.Individual, assets: [asset, other] });
    const hidden = factory.sharedLink({ type: SharedLinkType.Individual, assets: [asset, other], showMetadata: false });
    data.addSharedLink(visible).addSharedLink(hidden);
    await context.clearCookies();

    await page.goto(`${Route.viewSharedLink({ key: visible.key })}/photos/${asset.id}`);
    await app.viewer.waitForAsset(asset);
    await expect(app.viewer.infoButton).toBeVisible();
    await page.keyboard.press('i');
    await expect(app.viewer.detailPanel).toBeVisible();
    await page.keyboard.press('i');
    await expect(app.viewer.detailPanel).toHaveCount(0);

    await page.goto(`${Route.viewSharedLink({ key: hidden.key })}/photos/${asset.id}`);
    await app.viewer.waitForAsset(asset);
    await expect(app.viewer.infoButton).toHaveCount(0);
    await page.keyboard.press('i');
    await expect(app.viewer.detailPanel).toHaveCount(0);
  });

  test('owner can edit the description on a shared link', async ({ page, data, app }) => {
    const asset = factory.asset();
    const link = factory.sharedLink({ type: SharedLinkType.Individual, assets: [asset, factory.asset()] });
    data.addSharedLink(link);
    await page.goto(`${Route.viewSharedLink({ key: link.key })}/photos/${asset.id}`);
    await app.viewer.waitForAsset(asset);

    await app.viewer.infoButton.click();
    await expect(app.viewer.description).toBeVisible();
    await expect(app.viewer.description).toBeEnabled();
  });
});
