import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe('Registration', () => {
  test.beforeAll(() => {
    utils.initSdk();
  });

  test.beforeEach(async () => {
    await utils.resetDatabase();
  });

  test('admin registration', async ({ page }) => {
    // welcome
    await page.goto('/');
    await page.getByRole('button', { name: 'Getting Started' }).click();

    // register
    await expect(page).toHaveTitle(/Admin Registration/);
    await page.getByLabel('Admin Email').fill('admin@immich.app');
    await page.getByLabel('Admin Password', { exact: true }).fill('password');
    await page.getByLabel('Confirm Admin Password').fill('password');
    await page.getByLabel('Name').fill('Immich Admin');
    await page.getByRole('button', { name: 'Sign up' }).click();

    // login
    await expect(page).toHaveTitle(/Login/);
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('admin@immich.app');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Login' }).click();

    // onboarding
    await expect(page).toHaveURL('/auth/onboarding');
    await page.getByRole('button', { name: 'Theme' }).click();
    await page.getByRole('button', { name: 'Storage Template' }).click();
    await page.getByRole('button', { name: 'Done' }).click();

    // success
    await expect(page).toHaveURL('/photos');
  });

  test('user registration', async ({ context, page }) => {
    const admin = await utils.adminSetup();
    await utils.setAuthCookies(context, admin.accessToken);

    // create user
    await page.goto('/admin/user-management');
    await expect(page).toHaveTitle(/User Management/);
    await page.getByRole('button', { name: 'Create user' }).click();
    await page.getByLabel('Email').fill('user@immich.cloud');
    await page.getByLabel('Password', { exact: true }).fill('password');
    await page.getByLabel('Confirm Password').fill('password');
    await page.getByLabel('Name').fill('Immich User');
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    // logout
    await context.clearCookies();

    // login
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('user@immich.cloud');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Login' }).click();

    // change password
    await expect(page.getByRole('heading')).toHaveText('Change Password');
    await expect(page).toHaveURL('/auth/change-password');
    await page.getByLabel('New Password').fill('new-password');
    await page.getByLabel('Confirm Password').fill('new-password');
    await page.getByRole('button', { name: 'Change password' }).click();

    // login with new password
    await expect(page).toHaveURL('/auth/login');
    await page.getByLabel('Email').fill('user@immich.cloud');
    await page.getByLabel('Password').fill('new-password');
    await page.getByRole('button', { name: 'Login' }).click();

    // success
    await expect(page).toHaveURL(/\/photos/);
  });
});
