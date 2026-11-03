import { Route } from '#lib/route.ts';
import { expect, test, type MockData } from '#test/medium/fixtures.ts';
import { factory } from '#test/medium/mock/factories.ts';
import { SharedLinkType } from '@immich/sdk';

const setup = (data: MockData, overrides = {}) => {
  const assets = [factory.asset(), factory.asset()];
  data.addAssets(...assets);
  const album = data.addAlbum(factory.album({ albumName: 'Test Album' }), assets);
  const link = factory.sharedLink({ type: SharedLinkType.Album, album, ...overrides });
  data.addSharedLink(link);
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

  test('password protected link asks for the password and can show or hide it', async ({
    page,
    context,
    data,
    api,
    logger,
    app,
  }) => {
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

  test('owner removes an asset from an individual link', async ({ page, data, api, app }) => {
    const [first, second, third] = [factory.asset(), factory.asset(), factory.asset()];
    const link = factory.sharedLink({ type: SharedLinkType.Individual, assets: [first, second, third] });
    data.addSharedLink(link);
    await page.goto(Route.viewSharedLink({ key: link.key }));
    await expect(app.timeline.thumbnails).toHaveCount(3);

    await app.timeline.select(first);
    await app.sharedLink.removeFromSharedLinkButton.click();
    await app.sharedLink.confirmRemove();

    await expect(app.timeline.thumbnail(first)).toHaveCount(0);
    await expect(app.timeline.thumbnail(second)).toHaveCount(1);
    expect(api.removeSharedLinkAssets).toHaveBeenCalledWith({
      params: { id: link.id },
      body: { assetIds: [first.id] },
    });
  });
});
