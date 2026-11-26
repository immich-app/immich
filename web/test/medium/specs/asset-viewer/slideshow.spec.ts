import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { AssetTypeEnum } from '@immich/sdk';

test('slideshow ignores the favorite shortcut and exits by key or button', async ({ page, data, api, app }) => {
  const asset = factory.asset();
  data.addAssets(asset);
  await page.goto(Route.viewAsset({ id: asset.id }));
  await app.viewer.waitForAsset(asset);

  await app.viewer.openSlideshow();
  await expect(app.viewer.exitSlideshowButton).toBeVisible();

  await page.keyboard.press('f');
  await expect(app.toast('added_to_favorites')).not.toBeVisible();
  expect(api.updateAsset).not.toHaveBeenCalled();

  await page.keyboard.press('Escape');
  await expect(app.viewer.exitSlideshowButton).not.toBeVisible();

  await app.viewer.openSlideshow();
  await app.viewer.exitSlideshowButton.click();
  await expect(app.viewer.exitSlideshowButton).not.toBeVisible();
});

test('turn off auto-play hides play/pause button', async ({ page, data, app }) => {
  const asset = factory.asset();
  data.addAssets(asset);
  await page.goto(Route.viewAsset({ id: asset.id }));
  await page.evaluate(() => localStorage.setItem('slideshow-autoplay', 'false'));
  await page.reload();
  await app.viewer.waitForAsset(asset);

  await app.viewer.openSlideshow();

  await expect(app.viewer.exitSlideshowButton).toBeVisible();
  expect(await app.viewer.slideshowPlayPauseButton.count()).toBe(0);
  await page.evaluate(() => localStorage.removeItem('slideshow-autoplay'));
});

test('repeat returns to the first asset after the last one', async ({ page, data, app }) => {
  const [first, last] = [
    factory.asset({ fileCreatedAt: '2024-01-02T00:00:00.000Z' }),
    factory.asset({ fileCreatedAt: '2024-01-01T00:00:00.000Z' }),
  ];
  data.addAssets([first, last]);
  await page.goto(Route.viewAsset({ id: first.id }));
  await page.evaluate(() => localStorage.setItem('slideshow-repeat', 'true'));
  await page.reload();
  await app.viewer.waitForAsset(first);
  await app.viewer.openSlideshow();
  await app.viewer.slideshowNextButton.click();
  await app.viewer.waitForAsset(last);

  await app.viewer.slideshowNextButton.click();

  await app.viewer.waitForAsset(first);
  await expect(app.viewer.exitSlideshowButton).toBeVisible();
});

test('a slideshow started from an album plays only its assets', async ({ page, data, app }) => {
  const [first, outside, last] = [
    factory.asset({ fileCreatedAt: '2024-01-03T00:00:00.000Z' }),
    factory.asset({ fileCreatedAt: '2024-01-02T00:00:00.000Z' }),
    factory.asset({ fileCreatedAt: '2024-01-01T00:00:00.000Z' }),
  ];
  const album = factory.album();
  data.addAssets([first, outside, last]).addAlbums(album).addToAlbum(album.id, [first, last]);
  await page.goto(Route.viewAlbum(album));

  await app.album.slideshowButton.click();

  await app.viewer.waitForAsset(first);
  await app.viewer.slideshowNextButton.click();
  await app.viewer.waitForAsset(last);
});

test('a paused slideshow stays paused after a video', async ({ page, data, app }) => {
  const [first, video, last] = [
    factory.asset({ fileCreatedAt: '2024-01-03T00:00:00.000Z' }),
    factory.asset({ type: AssetTypeEnum.Video, duration: 10_000, fileCreatedAt: '2024-01-02T00:00:00.000Z' }),
    factory.asset({ fileCreatedAt: '2024-01-01T00:00:00.000Z' }),
  ];
  data.addAssets([first, video, last]);
  await page.goto(Route.viewAsset({ id: first.id }));
  await app.viewer.waitForAsset(first);
  await app.viewer.openSlideshow();
  await app.viewer.slideshowPlayPauseButton.click();
  await expect(app.viewer.slideshowPlayPauseButton).toHaveAccessibleName('play');

  await app.viewer.slideshowNextButton.click();
  await app.viewer.waitForAsset(video);
  await app.viewer.slideshowNextButton.click();

  await app.viewer.waitForAsset(last);
  await expect(app.viewer.slideshowPlayPauseButton).toHaveAccessibleName('play');
});
