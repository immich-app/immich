import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { AssetTypeEnum } from '@immich/sdk';

test.describe('video viewer', () => {
  test('space pauses and resumes the video', async ({ page, data, app }) => {
    const video = factory.asset({ type: AssetTypeEnum.Video, duration: 10_000 });
    data.addAssets(video);
    await page.goto(Route.viewAsset({ id: video.id }));
    await expect.poll(() => app.viewer.isVideoPaused()).toBe(false);

    await page.keyboard.press(' ');
    await expect.poll(() => app.viewer.isVideoPaused()).toBe(true);

    await page.keyboard.press(' ');
    await expect.poll(() => app.viewer.isVideoPaused()).toBe(false);
  });

  test('plays the encoded video when realtime transcoding is off', async ({ page, data, api, app }) => {
    const video = factory.asset({ type: AssetTypeEnum.Video, duration: 10_000 });
    data.addAssets(video);

    await page.goto(Route.viewAsset({ id: video.id }));

    await expect(app.viewer.video).toHaveAttribute('src', new RegExp(`/assets/${video.id}/video/playback`));
    expect(api.playAssetVideo).toHaveBeenCalledWith({ params: expect.objectContaining({ id: video.id }) });
  });
});
