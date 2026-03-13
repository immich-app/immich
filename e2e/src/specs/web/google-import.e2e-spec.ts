import { LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { utils } from 'src/utils';

/**
 * Creates a Google Takeout zip file with the expected directory structure:
 *   Takeout/Google Photos/<albumName>/<filename>
 *   Takeout/Google Photos/<albumName>/<filename>.json  (sidecar)
 */
function createTakeoutZip(
  items: { filename: string; album: string; favorite?: boolean; lat?: number; lng?: number; timestamp?: string }[],
): string {
  const tmpDir = mkdtempSync(join(tmpdir(), 'takeout-'));
  const baseDir = join(tmpDir, 'Takeout', 'Google Photos');

  for (const item of items) {
    const albumDir = join(baseDir, item.album);
    mkdirSync(albumDir, { recursive: true });

    // Create a unique 1x1 PNG for each item
    const png = new PNG({ width: 1, height: 1 });
    const hash = item.filename.length + item.album.length;
    png.data[0] = hash % 256;
    png.data[1] = (hash * 7) % 256;
    png.data[2] = (hash * 13) % 256;
    png.data[3] = 255;
    writeFileSync(join(albumDir, item.filename), PNG.sync.write(png));

    // Create sidecar JSON
    const sidecar = {
      title: item.filename,
      photoTakenTime: { timestamp: item.timestamp ?? '1609459200' },
      geoData: { latitude: item.lat ?? 0, longitude: item.lng ?? 0 },
      favorited: item.favorite ?? false,
      archived: false,
    };
    writeFileSync(join(albumDir, `${item.filename}.json`), JSON.stringify(sidecar));
  }

  const zipPath = join(tmpDir, 'takeout.zip');
  execSync(`cd "${tmpDir}" && zip -r takeout.zip Takeout`, { stdio: 'ignore' });
  return zipPath;
}

test.describe('Google Photos Import', () => {
  let admin: LoginResponseDto;
  let zipPath: string;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();

    zipPath = createTakeoutZip([
      { filename: 'IMG_001.png', album: 'Vacation', favorite: true, lat: 48.85, lng: 2.35, timestamp: '1609459200' },
      { filename: 'IMG_002.png', album: 'Vacation', lat: 48.86, lng: 2.36, timestamp: '1609545600' },
      { filename: 'IMG_003.png', album: 'Family', timestamp: '1609632000' },
    ]);
  });

  test.afterAll(() => {
    if (zipPath) {
      const tmpDir = join(zipPath, '..');
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('should complete the full Google Photos import flow', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);

    // Increase timeout for multi-step flow
    test.setTimeout(60_000);

    // Step 1: Navigate to import page and select source
    await page.goto('/import');
    await page.locator('[data-testid="source-google"]').click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: Select zip file
    const fileInput = page.locator('input[type="file"][accept=".zip"]');
    await fileInput.setInputFiles(zipPath);

    // Verify file appears in the list
    await expect(page.getByText('takeout.zip')).toBeVisible();

    // Click next to start scan
    await page.locator('[data-testid="next-button"]').click();

    // Step 3: Wait for scan to complete (auto-advances to review)
    // The scan step shows a scanning indicator, then automatically moves to review
    await expect(page.locator('[data-testid="albums-section"]')).toBeVisible({ timeout: 30_000 });

    // Step 4: Review — verify scan results (albums visible = scan found our photos)
    await expect(page.locator('[data-testid="album-Vacation"]')).toBeVisible();
    await expect(page.locator('[data-testid="album-Family"]')).toBeVisible();

    // Click import
    await page.locator('[data-testid="import-button"]').click();

    // Step 5: Wait for import to complete
    await expect(page.getByText(/import complete/i)).toBeVisible({ timeout: 30_000 });
  });
});
