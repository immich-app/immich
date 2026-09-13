import { addAssetsToAlbum, AlbumUserRole, type LoginResponseDto } from '@immich/sdk';
import { expect, test, type Page } from '@playwright/test';
import { createUserDto, signupDto } from 'src/fixtures';
import { asBearerAuth, utils } from 'src/utils';

const openActivityPanel = async (page: Page, path: string) => {
  await page.goto(path);
  await page.getByRole('button', { name: 'Activity', exact: true }).click();
  await page.locator('#activity-panel').waitFor();
};

const addAssetsViaUi = async (page: Page, assets: Array<{ id: string }>) => {
  await page.getByRole('button', { name: 'Add photos' }).click();
  for (const asset of assets) {
    const tile = page.locator(`[data-asset-id="${asset.id}"]`);
    await tile.hover();
    await tile.locator('[role="checkbox"]').click();
  }
  await page.getByRole('button', { name: 'Add assets' }).click();
};

test.describe('Album activity', () => {
  let admin: LoginResponseDto;
  let user: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    user = await utils.userSetup(admin.accessToken, createUserDto.user1);
  });

  const createSharedAlbum = async (albumName: string, assetCount: number) => {
    const assets = await Promise.all(Array.from({ length: assetCount }, () => utils.createAsset(admin.accessToken)));
    const album = await utils.createAlbum(admin.accessToken, {
      albumName,
      assetIds: assets.map(({ id }) => id),
      albumUsers: [{ userId: user.userId, role: AlbumUserRole.Editor }],
    });
    return { album, assets };
  };

  const adminAddedAPhoto = `${signupDto.admin.name} added a photo`;
  const adminAddedTwoPhotos = `${signupDto.admin.name} added 2 photos`;
  const userAddedAPhoto = `${createUserDto.user1.name} added a photo`;
  const comment = 'First!';

  test('lists additions and comments in order', async ({ context, page }) => {
    const { album, assets } = await createSharedAlbum('Activity Group Album', 2);
    await utils.setAuthCookies(context, admin.accessToken);

    await openActivityPanel(page, `/albums/${album.id}`);

    await expect(page.getByText(adminAddedTwoPhotos)).toBeVisible();
    await expect(page.getByAltText(`Asset added by ${signupDto.admin.name}`)).toHaveCount(2);
    for (const asset of assets) {
      await expect(page.locator(`#activity-panel a[href="/albums/${album.id}/photos/${asset.id}"]`)).toBeVisible();
    }

    await page.getByPlaceholder('Say something').fill(comment);
    await page.getByRole('button', { name: 'Send message' }).click();

    // the addition group should stay before the comment
    await expect(page.getByText(new RegExp(`${adminAddedTwoPhotos}|${comment}`))).toHaveText([
      adminAddedTwoPhotos,
      comment,
    ]);

    const userAsset = await utils.createAsset(user.accessToken);
    await addAssetsToAlbum(
      { id: album.id, bulkIdsDto: { ids: [userAsset.id] } },
      { headers: asBearerAuth(user.accessToken) },
    );
    await openActivityPanel(page, `/albums/${album.id}`);

    await expect(page.getByText(new RegExp(`${adminAddedTwoPhotos}|${comment}|${userAddedAPhoto}`))).toHaveText([
      adminAddedTwoPhotos,
      comment,
      userAddedAPhoto,
    ]);
  });

  test('shows an addition made through the UI without a reload', async ({ context, page }) => {
    const { album } = await createSharedAlbum('Activity Live Album', 1);
    await utils.setAuthCookies(context, admin.accessToken);

    await openActivityPanel(page, `/albums/${album.id}`);
    await expect(page.getByText(adminAddedAPhoto)).toHaveCount(1);

    const newPhoto = await utils.createAsset(admin.accessToken);
    await addAssetsViaUi(page, [newPhoto]);

    await expect(page.getByText(adminAddedAPhoto)).toHaveCount(2);
  });

  test('collapses large addition groups and expands them on demand', async ({ context, page }) => {
    const { album } = await createSharedAlbum('Activity Expand Album', 12);
    await utils.setAuthCookies(context, admin.accessToken);

    await openActivityPanel(page, `/albums/${album.id}`);

    await expect(page.getByText(`${signupDto.admin.name} added 12 photos`)).toBeVisible();
    // the 10th <img> renders but sits under the +3 overlay, so 9 visible + 3 hidden = 12
    await expect(page.getByAltText(`Asset added by ${signupDto.admin.name}`)).toHaveCount(10);

    await page.getByText('+3').click();

    await expect(page.getByAltText(`Asset added by ${signupDto.admin.name}`)).toHaveCount(12);
    await expect(page.getByText('+3')).toHaveCount(0);
  });

  test('omits addition entries when viewing a single asset', async ({ context, page }) => {
    const { album, assets } = await createSharedAlbum('Activity Asset View Album', 2);
    await utils.setAuthCookies(context, admin.accessToken);

    await openActivityPanel(page, `/albums/${album.id}/photos/${assets[0].id}`);

    await page.getByPlaceholder('Say something').fill('Nice shot!');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByText('Nice shot!')).toBeVisible();

    await expect(page.getByText(adminAddedAPhoto)).toHaveCount(0);
    await expect(page.getByAltText(`Asset added by ${signupDto.admin.name}`)).toHaveCount(0);
  });
});
