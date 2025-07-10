import { getUserAdmin } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { asBearerAuth, utils } from 'src/utils';

test.describe('User Administration', () => {
  test.beforeAll(() => {
    utils.initSdk();
  });

  test.beforeEach(async () => {
    await utils.resetDatabase();
  });

  test('validate admin/users link', async ({ context, page }) => {
    const admin = await utils.adminSetup();
    await utils.setAuthCookies(context, admin.accessToken);

    // Navigate to user management page and verify title and header
    await page.goto(`/admin/users`);
    await expect(page).toHaveTitle(/User Management/);
    await expect(page.getByText('User Management')).toBeVisible();
  });

  test('create user', async ({ context, page }) => {
    const admin = await utils.adminSetup();
    await utils.setAuthCookies(context, admin.accessToken);

    // Create a new user
    await page.goto('/admin/users');
    await page.getByRole('button', { name: 'Create user' }).click();
    await page.getByLabel('Email').fill('user@immich.cloud');
    await page.getByLabel('Password', { exact: true }).fill('password');
    await page.getByLabel('Confirm Password').fill('password');
    await page.getByLabel('Name').fill('Immich User');
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    // Verify the user exists in the user list
    await page.getByRole('row', { name: 'user@immich.cloud' });
  });

  test('promote to admin', async ({ context, page }) => {
    const admin = await utils.adminSetup();
    await utils.setAuthCookies(context, admin.accessToken);

    const user = await utils.userSetup(admin.accessToken, {
      name: 'Admin 2',
      email: 'admin2@immich.cloud',
      password: 'password',
    });

    expect(user.isAdmin).toBe(false);

    await page.goto(`/admin/users/${user.userId}`);

    await page.getByRole('button', { name: 'Edit user' }).click();
    await expect(page.getByLabel('Admin User')).not.toBeChecked();
    await page.getByText('Admin User').click();
    await expect(page.getByLabel('Admin User')).toBeChecked();
    await page.getByRole('button', { name: 'Confirm' }).click();

    const updated = await getUserAdmin({ id: user.userId }, { headers: asBearerAuth(admin.accessToken) });
    expect(updated.isAdmin).toBe(true);
  });

  test('revoke admin access', async ({ context, page }) => {
    const admin = await utils.adminSetup();
    await utils.setAuthCookies(context, admin.accessToken);

    const user = await utils.userSetup(admin.accessToken, {
      name: 'Admin 2',
      email: 'admin2@immich.cloud',
      password: 'password',
      isAdmin: true,
    });

    expect(user.isAdmin).toBe(true);

    await page.goto(`/admin/users/${user.userId}`);

    await page.getByRole('button', { name: 'Edit user' }).click();
    await expect(page.getByLabel('Admin User')).toBeChecked();
    await page.getByText('Admin User').click();
    await expect(page.getByLabel('Admin User')).not.toBeChecked();
    await page.getByRole('button', { name: 'Confirm' }).click();

    const updated = await getUserAdmin({ id: user.userId }, { headers: asBearerAuth(admin.accessToken) });
    expect(updated.isAdmin).toBe(false);
  });
});
