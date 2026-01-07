import { LoginResponseDto, ManualJobName, QueueName } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe.configure({ mode: 'serial' });

test.describe('Integrity', () => {
  let admin: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  test('run integrity jobs to update stats', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);

    await utils.createJob(admin.accessToken, {
      name: ManualJobName.IntegrityUntrackedFiles,
    });

    await utils.waitForQueueFinish(admin.accessToken, QueueName.IntegrityCheck);

    await page.goto('/admin/maintenance');

    const count = page.getByText('Untracked Files').locator('..').locator('..').locator('div').nth(1);

    const previousCount = parseInt((await count.textContent()) ?? '');

    await utils.putTextFile('untracked', `/data/upload/${admin.userId}/untracked1.png`);

    const checkButton = page.getByText('Integrity Report').locator('..').getByRole('button', { name: 'Check All' });

    await checkButton.click();
    await expect(checkButton).toBeEnabled();

    await expect(count).toContainText((previousCount + 1).toString());
  });
});
