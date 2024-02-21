import {
  AlbumResponseDto,
  AssetResponseDto,
  LoginResponseDto,
  SharedLinkResponseDto,
  SharedLinkType,
  createAlbum,
  createSharedLink,
} from '@immich/sdk';
import { test } from '@playwright/test';
import { apiUtils, asBearerAuth, dbUtils } from 'src/utils';

test.describe('Shared Links', () => {
  let admin: LoginResponseDto;
  let asset: AssetResponseDto;
  let album: AlbumResponseDto;
  let sharedLink: SharedLinkResponseDto;

  test.beforeAll(async () => {
    apiUtils.setup();
    await dbUtils.reset();
    admin = await apiUtils.adminSetup();
    asset = await apiUtils.createAsset(admin.accessToken);
    album = await createAlbum(
      {
        createAlbumDto: {
          albumName: 'Test Album',
          assetIds: [asset.id],
        },
      },
      { headers: asBearerAuth(admin.accessToken) }
      // { headers: asBearerAuth(admin.accessToken)},
    );
    sharedLink = await createSharedLink(
      {
        sharedLinkCreateDto: {
          type: SharedLinkType.Album,
          albumId: album.id,
        },
      },
      { headers: asBearerAuth(admin.accessToken) }
    );
  });

  test.afterAll(async () => {
    await dbUtils.teardown();
  });

  test('download from a shared link', async ({ page }) => {
    await page.goto(`/share/${sharedLink.key}`);
    await page.getByRole('heading', { name: 'Test Album' }).waitFor();
    await page.locator('.group > div').first().hover();
    await page.waitForSelector('#asset-group-by-date svg');
    await page.getByRole('checkbox').click();
    await page.getByRole('button', { name: 'Download' }).click();
    await page.getByText('DOWNLOADING').waitFor();
  });
});
