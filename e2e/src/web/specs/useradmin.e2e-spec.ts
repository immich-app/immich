import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe('User Administration', () => {
  test.beforeAll(() => {
    utils.initSdk();
  });

  test.beforeEach(async () => {
    await utils.resetDatabase();
  });

  test('validate admin/user-management link', async ({ context, page }) => {
    const admin = await utils.adminSetup();
    await utils.setAuthCookies(context, admin.accessToken);

    // Navigate to user management page and verify title and header
    await page.goto('/admin/user-management');
    await expect(page).toHaveTitle('User Management');
    await expect(page.locator('#user-page-header')).toHaveText('User Management');
  });

  test('create / edit user modal', async ({ context, page }) => {
    const admin = await utils.adminSetup();
    await utils.setAuthCookies(context, admin.accessToken);

    // Create a new user
    await page.goto('/admin/user-management');
    await page.getByRole('button', { name: 'Create user' }).click();
    await page.getByLabel('Email').fill('user@immich.cloud');
    await page.getByLabel('Password', { exact: true }).fill('password');
    await page.getByLabel('Confirm Password').fill('password');
    await page.getByLabel('Name').fill('Immich User');
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    // Edit the created user
    await page.getByRole('row', { name: 'user@immich.cloud' }).getByRole('button', { name: 'Edit user' }).click();

    await expect(page.locator('#id-2-title')).toHaveText('Edit user');
    await page.getByLabel('Name').fill('Updated Immich User');
    await page.getByRole('button', { name: 'Confirm' }).click();

    // Verify the user update
    await page.reload();
    // this test will fail unless the browser is restarted
    await expect(page.getByRole('row', { name: 'user@immich.cloud' }).getByText('Updated Immich User')).toBeVisible();
  });

  test('toggle admin switch for user', async ({ context, page }) => {
    const admin = await utils.adminSetup();
    await utils.setAuthCookies(context, admin.accessToken);

    // Create a new user
    await page.goto('/admin/user-management');
    await page.getByRole('button', { name: 'Create user' }).click();
    await page.getByLabel('Email').fill('user@immich.cloud');
    await page.getByLabel('Password', { exact: true }).fill('password');
    await page.getByLabel('Confirm Password').fill('password');
    await page.getByLabel('Name').fill('Immich User');
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    // Open the user edit modal for the new user
    await page.getByRole('row', { name: 'user@immich.cloud' }).getByRole('button', { name: 'Edit user' }).click();

    // Assert that the edit user form is visible
    await expect(page.locator('#edit-user-form')).toBeVisible();

    // Toggle admin switch on
    await page.locator('#edit-user-form span').click();
    await expect(page.getByLabel('Admin User')).toBeChecked();
    await page.getByRole('button', { name: 'Confirm' }).click();

    // Verify the admin switch is enabled
    await page.reload();
    await page.getByRole('row', { name: 'user@immich.cloud' }).getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByLabel('Admin User')).toBeChecked();

    // Toggle admin switch off
    await page.locator('#edit-user-form span').click();
    await page.getByRole('button', { name: 'Confirm' }).click();

    // Verify the admin switch is disabled
    await page.getByRole('row', { name: 'user@immich.cloud' }).getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByLabel('Admin User')).not.toBeChecked();
    await page.getByRole('button', { name: 'Confirm' }).click();
  });
});
