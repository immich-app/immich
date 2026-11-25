import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { AssetTypeEnum } from '@immich/sdk';

test.describe('download from the viewer', () => {
  test('saves the original under its file name', async ({ page, data, api, app }) => {
    const asset = factory.asset({ originalFileName: 'holiday.jpg' });
    data.addAssets(asset);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);

    const [download] = await Promise.all([page.waitForEvent('download'), app.viewer.download()]);

    expect(download.suggestedFilename()).toBe('holiday.jpg');
    await expect(app.toast('downloading_asset_filename')).toBeVisible();
    expect(api.downloadAsset).toHaveBeenCalledWith({ params: expect.objectContaining({ id: asset.id }) });
  });

  test('a live photo also saves its motion video with a -motion suffix', async ({ page, data, api, app }) => {
    const video = factory.asset({ type: AssetTypeEnum.Video, originalFileName: 'holiday.mov' });
    const asset = factory.asset({ originalFileName: 'holiday.heic', livePhotoVideoId: video.id });
    data.addAssets([asset, video]);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);

    const [photo] = await Promise.all([page.waitForEvent('download'), app.viewer.download()]);
    const motion = await page.waitForEvent('download');

    expect(photo.suggestedFilename()).toBe('holiday.heic');
    expect(motion.suggestedFilename()).toBe('holiday-motion.mov');
    expect(api.downloadAsset).toHaveBeenCalledWith({ params: expect.objectContaining({ id: asset.id }) });
    expect(api.downloadAsset).toHaveBeenCalledWith({ params: expect.objectContaining({ id: video.id }) });
  });

  test('a live photo skips a motion video extracted from an Android photo', async ({ page, data, api, app }) => {
    const video = factory.asset({ type: AssetTypeEnum.Video, originalFileName: 'holiday.mp4' });
    const asset = factory.asset({ originalFileName: 'holiday.jpg', livePhotoVideoId: video.id });
    data.addAssets([asset, video]).setOriginalPath(video, `/data/encoded-video/user/ab/cd/${video.id}-MP.mp4`);
    await page.clock.install();
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);

    const [photo] = await Promise.all([page.waitForEvent('download'), app.viewer.download()]);
    await page.clock.runFor(1000);

    expect(photo.suggestedFilename()).toBe('holiday.jpg');
    expect(api.downloadAsset).toHaveBeenCalledWith({ params: expect.objectContaining({ id: asset.id }) });
    expect(api.searchAssetFiles).toHaveBeenCalledWith({ params: expect.objectContaining({ assetId: video.id }) });
    expect(api.downloadAsset).not.toHaveBeenCalledWith({ params: expect.objectContaining({ id: video.id }) });
  });
});
