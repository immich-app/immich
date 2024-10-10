import { expect, test } from '@playwright/test';
import { step } from 'src/step';
import { utils } from 'src/utils';

test.describe('Registration', () => {
  test.beforeAll(() => {
    utils.initSdk();
  });

  test.beforeEach(async () => {
    await utils.resetDatabase();
  });

  test('admin registration', async ({ page }) => {
    step('Navigate to homepage');
    await page.goto('/');

    step('Click Getting Started link');
    await page.getByRole('link', { name: 'Getting Started' }).click();

    step('Verify Admin Registration page title');
    await expect(page).toHaveTitle(/Admin Registration/);

    step('Fill Admin Registration form');
    await page.getByLabel('Admin Email').fill('admin@immich.app');
    await page.getByLabel('Admin Password', { exact: true }).fill('password');
    await page.getByLabel('Confirm Admin Password').fill('password');
    await page.getByLabel('Name').fill('Immich Admin');

    step('Submit Admin Registration form');
    await page.getByRole('button', { name: 'Sign up' }).click();

    step('Verify Login page title');
    await expect(page).toHaveTitle(/Login/);

    step('Navigate to Login page');
    await page.goto('/auth/login');

    step('Fill login form');
    await page.getByLabel('Email').fill('admin@immich.app');
    await page.getByLabel('Password').fill('password');

    step('Submit login form');
    await page.getByRole('button', { name: 'Login' }).click();

    step('Verify Onboarding page URL');
    await expect(page).toHaveURL('/auth/onboarding');

    step('Complete onboarding steps');
    await page.getByRole('button', { name: 'Theme' }).click();
    await page.getByRole('button', { name: 'Privacy' }).click();
    await page.getByRole('button', { name: 'Storage Template' }).click();
    await page.getByRole('button', { name: 'Done' }).click();

    step('Verify Photos page URL');
    await expect(page).toHaveURL('/photos');
  });

  test('user registration', async ({ context, page }) => {
    step('Admin setup');
    const admin = await utils.adminSetup();
    await utils.setAuthCookies(context, admin.accessToken);

    step('Navigate to User Management');
    await page.goto('/admin/user-management');
    await expect(page).toHaveTitle(/User Management/);

    step('Create new user');
    await page.getByRole('button', { name: 'Create user' }).click();
    await page.getByLabel('Email').fill('user@immich.cloud');
    await page.getByLabel('Password', { exact: true }).fill('password');
    await page.getByLabel('Confirm Password').fill('password');
    await page.getByLabel('Name').fill('Immich User');
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    step('Clear cookies (logout)');
    await context.clearCookies();

    step('Navigate to login page');
    await page.goto('/auth/login');

    step('Login as user');
    await page.getByLabel('Email').fill('user@immich.cloud');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Login' }).click();

    step('Verify Change Password page URL');
    await expect(page.getByRole('heading')).toHaveText('Change Password');
    await expect(page).toHaveURL('/auth/change-password');

    step('Change password');
    await page.getByLabel('New Password').fill('new-password');
    await page.getByLabel('Confirm Password').fill('new-password');
    await page.getByRole('button', { name: 'Change password' }).click();

    step('Login with new password');
    await expect(page).toHaveURL('/auth/login');
    await page.getByLabel('Email').fill('user@immich.cloud');
    await page.getByLabel('Password').fill('new-password');
    await page.getByRole('button', { name: 'Login' }).click();

    step('Verify successful login (Photos page URL)');
    await expect(page).toHaveURL(/\/photos/);
  });
});
