import {
  LoginResponseDto,
  confirmRecoveryKey,
  enableTelemetry,
  importRecoveryKey,
  resetOrchestrator,
} from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { io, type Socket } from 'socket.io-client';
import { asBearerAuth, baseUrl, utils } from 'src/utils';

test.describe.configure({ mode: 'serial' });

test.describe('Yucca Backups', () => {
  let admin: LoginResponseDto;
  let socket: Socket;

  const waitForTaskEnd = () =>
    new Promise<void>((resolve) => {
      const listener = (msg: string) => {
        try {
          const payload = JSON.parse(msg);
          if (payload.type === 'TaskEnd') {
            socket.offAny(listener);
            resolve();
          }
        } catch {
          // no-op
        }
      };
      socket.onAny(listener);
    });

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();

    const headers = asBearerAuth(admin.accessToken);
    await resetOrchestrator({ headers });
    await importRecoveryKey({ importRecoveryKeyRequest: { recoveryKey: '0'.repeat(64) } }, { headers });
    await confirmRecoveryKey({ headers });
    await enableTelemetry({ headers });
    await utils.mkFolder('/local-backend');

    socket = io(baseUrl, {
      path: '/api/yucca/socket.io',
      transports: ['websocket'],
      extraHeaders: headers,
      forceNew: true,
    });
    await new Promise<void>((resolve) => socket.on('connect', () => resolve()));
  });

  test.afterAll(async () => {
    socket?.close();
  });

  test('onboarding configures a local backend', async ({ context, page }) => {
    test.setTimeout(30_000);
    await utils.setAuthCookies(context, admin.accessToken);

    await page.goto('/backups');

    const dialog = page.getByRole('dialog');
    await expect(dialog.filter({ hasText: 'Backup options' })).toBeVisible();
    await dialog.getByText('Local Folder').click();

    await expect(dialog.filter({ hasText: 'Create local backend' })).toBeVisible();
    await dialog.getByLabel('Path').fill('/local-backend');
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog.filter({ hasText: 'Configure Your Immich Backup' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toHaveCount(0);

    await expect(page.getByRole('link', { name: 'Repositories' })).toBeVisible();
  });

  test('manually triggers a backup and waits for completion', async ({ context, page }) => {
    test.setTimeout(60_000);
    await utils.setAuthCookies(context, admin.accessToken);

    await page.goto('/backups/repositories');
    const backupNow = page.getByRole('button', { name: 'Backup Now' });
    await expect(backupNow).toBeVisible();

    const taskEnd = waitForTaskEnd();
    await backupNow.click();
    await expect(page.getByRole('dialog').filter({ hasText: 'Log Output' })).toBeVisible();

    await taskEnd;
  });

  test('resets immich and restores from the local yucca backup', async ({ context, page }) => {
    test.setTimeout(120_000);
    await utils.setAuthCookies(context, admin.accessToken);

    await utils.resetBackups(admin.accessToken);
    await utils.createBackup(admin.accessToken);

    await resetOrchestrator({ headers: asBearerAuth(admin.accessToken) });
    await utils.resetDatabase();

    await page.goto('/');
    await page.getByRole('button', { name: 'Restore from backup' }).click();

    try {
      await page.waitForURL('/maintenance**');
    } catch {
      await page.goto('/maintenance');
      await page.waitForURL('/maintenance**');
    }

    await page.getByRole('button', { name: 'FUTO Backups' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.filter({ hasText: 'Import recovery key' })).toBeVisible();
    await dialog.getByLabel('Recovery Key').fill('0'.repeat(64));
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog.filter({ hasText: 'Where would you like to restore from?' })).toBeVisible();
    await dialog.getByText('Local Folder').click();

    await expect(dialog.filter({ hasText: 'Create local backend' })).toBeVisible();
    await dialog.getByLabel('Path').fill('/local-backend');
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog.filter({ hasText: 'Select Restore Point' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Select' }).first().click();

    await expect(dialog.filter({ hasText: /Restore from/ })).toBeVisible();
    await dialog.getByRole('button', { name: 'Restore' }).first().click();

    await expect(dialog.filter({ hasText: 'Confirm restore from snapshot' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Restore' }).click();

    await expect(dialog.filter({ hasText: 'Restoring' })).toBeVisible();
    await expect(dialog.filter({ hasText: 'Restoring' })).toBeHidden({ timeout: 60_000 });

    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Restore', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Restore' }).click();

    await page.waitForURL('/maintenance?**');
    await page.waitForURL('/photos', { timeout: 90_000 });
  });
});
