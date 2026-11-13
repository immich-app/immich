import { Route } from '#lib/route.ts';
import type { MockData } from '#test/common/data.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { SharedLinkType } from '@immich/sdk';

const setup = (data: MockData, overrides = {}) => {
  const assets = [factory.asset(), factory.asset()];
  data.addAssets(assets);
  const album = factory.album({ albumName: 'Test Album' });
  data.addAlbums(album).addToAlbum(album.id, assets);
  const link = factory.sharedLink({ type: SharedLinkType.Album, album, ...overrides });
  data.addSharedLinks(link);
  return { link, album, assets };
};

test.describe('shared link', () => {
  test('guest downloads one asset and then the whole album', async ({ page, context, data, api, app }) => {
    const { link, album, assets } = setup(data);
    await context.clearCookies();
    await page.goto(Route.viewSharedLink({ key: link.key }));
    await expect(app.sharedLink.heading('Test Album')).toBeVisible();

    await app.timeline.select(assets[0]);
    const [single] = await Promise.all([page.waitForEvent('download'), app.sharedLink.downloadButton.click()]);
    expect(single.suggestedFilename()).toBe(assets[0].originalFileName);
    expect(api.downloadAsset).toHaveBeenCalledWith({
      params: expect.objectContaining({ id: assets[0].id, key: link.key }),
    });

    await page.goto(Route.viewSharedLink({ key: link.key }));
    await expect(app.sharedLink.heading('Test Album')).toBeVisible();
    const [all] = await Promise.all([page.waitForEvent('download'), app.sharedLink.downloadButton.click()]);
    expect(all.suggestedFilename()).toMatch(/\.zip$/);
    expect(api.downloadArchive).toHaveBeenCalled();
    expect(api.getDownloadInfo).toHaveBeenCalledWith({
      params: expect.objectContaining({ key: link.key }),
      body: { albumId: album.id },
    });
  });

  test('password link asks for it and can show or hide it', async ({ page, context, data, api, logger, app }) => {
    const { link } = setup(data, { password: 'test-password' });
    await context.clearCookies();
    await page.goto(Route.viewSharedLink({ key: link.key }));

    await app.sharedLink.passwordInput.fill('test-password');
    await app.sharedLink.showPasswordButton.click();
    await expect(app.sharedLink.passwordInput).toHaveAttribute('type', 'text');
    await app.sharedLink.hidePasswordButton.click();
    await expect(app.sharedLink.passwordInput).toHaveAttribute('type', 'password');

    await app.sharedLink.submitButton.click();
    await expect(app.sharedLink.heading('Test Album')).toBeVisible();
    expect(api.sharedLinkLogin).toHaveBeenCalledWith({
      params: expect.objectContaining({ key: link.key }),
      body: { password: 'test-password' },
    });
    expect(logger.error).toHaveBeenCalledWith(/401/);
  });

  test('invalid key shows the not found page', async ({ page, context, logger, app }) => {
    await context.clearCookies();
    await page.goto(Route.viewSharedLink({ key: 'invalid' }));
    await expect(app.sharedLink.notFoundHeading).toBeVisible();
    expect(logger.error).toHaveBeenCalledWith(/404/);
  });

  test('authenticated user can navigate from the share page to the timeline', async ({ page, data, app }) => {
    const { link, assets } = setup(data);
    await page.goto(Route.viewSharedLink({ key: link.key }));
    await expect(app.sharedLink.heading('Test Album')).toBeVisible();

    await app.sharedLink.homeLink.click();
    await page.waitForURL(Route.photos());
    await expect(app.timeline.thumbnail(assets[0])).toBeVisible();
  });

  test('turning show metadata off also turns downloads off in the create form', async ({ page, data, app }) => {
    const asset = factory.asset();
    data.addAssets(asset);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);

    await app.viewer.shareButton.click();
    await expect(app.sharedLink.form.allowDownloadSwitch).toBeChecked();

    await app.sharedLink.form.showMetadataSwitch.click();
    await expect(app.sharedLink.form.showMetadataSwitch).not.toBeChecked();
    await expect(app.sharedLink.form.allowDownloadSwitch).not.toBeChecked();
    await expect(app.sharedLink.form.allowDownloadSwitch).toBeDisabled();
  });

  test('the list shows a cover for album, individual, empty and broken links', async ({ page, data, logger, app }) => {
    const { link: albumLink } = setup(data);
    const broken = factory.asset();
    const individual = factory.sharedLink({ type: SharedLinkType.Individual, assets: [factory.asset()] });
    const empty = factory.sharedLink({ type: SharedLinkType.Individual, assets: [] });
    const notResized = factory.sharedLink({ type: SharedLinkType.Individual, assets: [broken] });
    data.addSharedLinks(individual).addSharedLinks(empty).addSharedLinks(notResized).markBroken(broken);
    await page.goto(Route.sharedLinks());

    for (const link of [albumLink, individual, empty]) {
      await expect(app.sharedLink.cover(link)).toBeVisible();
    }
    await expect(app.sharedLink.brokenCover(notResized)).toBeVisible();
    expect(logger.error).toHaveBeenCalledWith(/404/);
  });

  test('owner removes an asset from an individual link', async ({ page, data, api, app }) => {
    const [first, second, third] = [factory.asset(), factory.asset(), factory.asset()];
    const link = factory.sharedLink({ type: SharedLinkType.Individual, assets: [first, second, third] });
    data.addSharedLinks(link);
    await page.goto(Route.viewSharedLink({ key: link.key }));
    await expect(app.timeline.thumbnails).toHaveCount(3);

    await app.timeline.select(first);
    await app.sharedLink.removeFromSharedLinkButton.click();
    await app.dialogButton('cancel').click();
    await expect(app.dialog).toBeHidden();
    expect(api.removeSharedLinkAssets).not.toHaveBeenCalled();

    await app.sharedLink.removeFromSharedLinkButton.click();
    await app.sharedLink.confirmRemove();

    await expect(app.timeline.thumbnail(first)).toHaveCount(0);
    await expect(app.timeline.thumbnail(second)).toHaveCount(1);
    expect(api.removeSharedLinkAssets).toHaveBeenCalledWith({
      params: { id: link.id },
      body: { assetIds: [first.id] },
    });
  });

  test('deletes a shared link', async ({ page, data, api, app }) => {
    const link = factory.sharedLink({ type: SharedLinkType.Individual, assets: [factory.asset()] });
    data.addSharedLinks(link);
    await page.goto(Route.sharedLinks());

    await app.sharedLink.deleteButton.click();
    await app.dialogButton('cancel').click();
    await expect(app.dialog).toBeHidden();
    expect(api.removeSharedLink).not.toHaveBeenCalled();

    await app.sharedLink.deleteButton.click();
    await app.dialogButton('delete').click();

    await expect(app.sharedLink.card(link)).toHaveCount(0);
    expect(api.removeSharedLink).toHaveBeenCalledWith({ params: { id: link.id } });
  });
});
