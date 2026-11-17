import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { AssetJobName, AssetTypeEnum } from '@immich/sdk';

test('runs each asset job from the viewer', async ({ page, data, api, app }) => {
  const asset = factory.asset({ type: AssetTypeEnum.Video });
  data.addAssets(asset);
  await page.goto(Route.viewAsset({ id: asset.id }));
  await app.viewer.waitForAsset(asset);
  await expect(app.viewer.video).toBeFocused();

  for (const { action, name, toast } of [
    { action: 'refresh_faces', name: AssetJobName.RefreshFaces, toast: 'refreshing_faces' },
    { action: 'refresh_metadata', name: AssetJobName.RefreshMetadata, toast: 'refreshing_metadata' },
    { action: 'refresh_thumbnails', name: AssetJobName.RegenerateThumbnail, toast: 'regenerating_thumbnails' },
    { action: 'refresh_encoded_videos', name: AssetJobName.TranscodeVideo, toast: 'refreshing_encoded_video' },
  ]) {
    await app.viewer.runJob(action);

    await expect(app.toast(toast)).toBeVisible();
    expect(api.runAssetJobs).toHaveBeenCalledWith({ body: { name, assetIds: [asset.id] } });
  }
});
