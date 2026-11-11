import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { opaquePng } from '#test/common/helpers.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test('sets an asset as the profile picture', async ({ page, data, api, app }) => {
  const asset = factory.asset({ width: 1000, height: 1000 });
  data.addAssets(asset);
  api.on({ viewAsset: () => ({ body: opaquePng, contentType: 'image/png' }) });
  await page.goto(Route.viewAsset({ id: asset.id }));
  await app.viewer.waitForAsset(asset);

  await app.viewer.setProfilePicture();
  await app.viewer.profilePicture.saveButton.click();

  await expect(app.toast('profile_picture_set')).toBeVisible();
  await expect(app.dialog).toHaveCount(0);
  expect(api.createProfileImage).toHaveBeenCalledWith({
    body: expect.stringMatching(/filename="profile-picture\.png"\r\nContent-Type: image\/png/),
  });
});
