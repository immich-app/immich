import { LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe('Dashboard', () => {
  let admin: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  test(`should display greeting, quick actions, tag spotlight and statistics`, async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);

    await page.goto(`/dashboard`);

    const greetings = page.locator('h1');
    await expect(greetings).toContainText(admin.name);
    const quickActions = page.getByText('Quick Actions');
    await expect(quickActions).toBeVisible();
    const tagSpotlight = page.getByText('Tag Spotlight');
    await expect(tagSpotlight).toBeVisible();

    const statistics = page.getByText('Statistics');
    await expect(statistics).toBeVisible();
    const mediaBreakdown = page.getByText('Media Breakdown');
    await expect(mediaBreakdown).toBeVisible();
    const libraryLocations = page.getByText('Library Locations');
    await expect(libraryLocations).toBeVisible();
    const albumsOverview = page.getByText('Albums Overview');
    await expect(albumsOverview).toBeVisible();
  });

  test(`quick actions clicks should navigate to the correct page`, async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);

    await page.goto('/dashboard');
    const newAction = page.getByRole('link', { name: 'New' });
    await newAction.click();
    await expect(page).toHaveURL(/.*\/recently-added/);

    await page.goto('/dashboard');
    const viewPeopleAction = page.getByRole('link', { name: 'View People' });
    await viewPeopleAction.click();
    await expect(page).toHaveURL(/.*\/people/);

    await page.goto('/dashboard');
    const duplicatesAction = page.getByRole('link', { name: 'Duplicates' });
    await duplicatesAction.click();
    await expect(page).toHaveURL(/.*\/duplicates/);

    await page.goto('/dashboard');
    const settingsAction = page.getByRole('link', { name: 'Settings' });
    await settingsAction.click();
    await expect(page).toHaveURL(/.*\/user-settings/);
  });

  test(`statistics clicks should navigate to the correct page`, async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);

    // Media Breakdown
    await page.goto('/dashboard');
    const mediaBreakdown = page.getByRole('link', { name: 'Media Breakdown' });
    await mediaBreakdown.click();
    await expect(page).toHaveURL(/.*\/photos/);

    // Library Locations
    const libraryCard = page.locator('section').filter({ hasText: 'Library Locations' });

    await page.goto('/dashboard');
    const timeline = libraryCard.getByRole('link', { name: 'Timeline' });
    await timeline.click();
    await expect(page).toHaveURL(/.*\/photos/);

    await page.goto('/dashboard');
    const favorites = libraryCard.getByRole('link', { name: 'Favorites' });
    await favorites.click();
    await expect(page).toHaveURL(/.*\/favorites/);

    await page.goto('/dashboard');
    const archive = libraryCard.getByRole('link', { name: 'Archive' });
    await archive.click();
    await expect(page).toHaveURL(/.*\/archive/);

    await page.goto('/dashboard');
    const trash = libraryCard.getByRole('link', { name: 'Trash' });
    await trash.click();
    await expect(page).toHaveURL(/.*\/trash/);

    // Albums Overview
    await page.goto('/dashboard');
    const ownedAlbums = page.getByRole('link', { name: 'Owned Albums' });
    await ownedAlbums.click();
    await expect(page).toHaveURL(/.*\/albums/);

    await page.goto('/dashboard');
    const sharedAlbums = page.getByRole('link', { name: 'Shared Albums' });
    await sharedAlbums.click();
    await expect(page).toHaveURL(/.*\/sharing/);
  });

  test(`redirects to /dashboard when use-dashboard-as-landing is enabled `, async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);

    await page.goto('/');
    await expect(page).toHaveURL(/.*\/photos/);

    // Change preferences
    await page.goto('/user-settings');
    const appSettingsButton = page.locator('button').filter({ hasText: 'App Settings' });
    await appSettingsButton.click();
    const dashboardAsLanding = page.getByText('Dashboard as landing page');
    await dashboardAsLanding.click();

    await page.goto('/');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });
});
