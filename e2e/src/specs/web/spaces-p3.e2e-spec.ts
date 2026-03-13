import type { LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe('Spaces P3 — Activity Feed, Panel Tabs, New-Since-Last-Visit', () => {
  let admin: LoginResponseDto;
  let user2: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    user2 = await utils.userSetup(admin.accessToken, {
      email: 'user2@immich.cloud',
      name: 'User Two',
      password: 'password',
    });
  });

  test.describe('Activity Feed', () => {
    test('should show activity feed with "added N photos" event after adding assets', async ({ context, page }) => {
      const space = await utils.createSpace(admin.accessToken, { name: 'Activity Feed Test' });
      const asset1 = await utils.createAsset(admin.accessToken);
      const asset2 = await utils.createAsset(admin.accessToken);
      const asset3 = await utils.createAsset(admin.accessToken);
      await utils.addSpaceAssets(admin.accessToken, space.id, [asset1.id, asset2.id, asset3.id]);

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto(`/spaces/${space.id}`);

      // Open the panel by clicking the members/panel button
      await page.locator('[data-testid="space-members-button"]').click();
      await expect(page.locator('[data-testid="space-panel"]')).toHaveClass(/translate-x-0/);

      // Activity tab should be active by default
      await expect(page.locator('[data-testid="tab-activity"]')).toBeVisible();

      // Verify the "added 3 photos" activity event is visible
      await expect(page.locator('[data-testid="space-panel"]')).toContainText('added 3 photos');
    });

    test('should show empty state when no activities exist', async ({ context, page }) => {
      const space = await utils.createSpace(admin.accessToken, { name: 'Empty Activity' });

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto(`/spaces/${space.id}`);

      await page.locator('[data-testid="space-members-button"]').click();
      await expect(page.locator('[data-testid="space-panel"]')).toHaveClass(/translate-x-0/);

      await expect(page.locator('[data-testid="activity-empty-state"]')).toBeVisible();
      await expect(page.locator('[data-testid="activity-empty-state"]')).toContainText('No activity yet');
    });

    test('should show member join activity when a member is added', async ({ context, page }) => {
      const space = await utils.createSpace(admin.accessToken, { name: 'Member Join Activity' });
      await utils.addSpaceMember(admin.accessToken, space.id, { userId: user2.userId });

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto(`/spaces/${space.id}`);

      await page.locator('[data-testid="space-members-button"]').click();
      await expect(page.locator('[data-testid="space-panel"]')).toHaveClass(/translate-x-0/);

      await expect(page.locator('[data-testid="space-panel"]')).toContainText('joined as');
    });
  });

  test.describe('Tab Switching', () => {
    test('should switch between Activity and Members tabs', async ({ context, page }) => {
      const space = await utils.createSpace(admin.accessToken, { name: 'Tab Switch Test' });
      const asset = await utils.createAsset(admin.accessToken);
      await utils.addSpaceAssets(admin.accessToken, space.id, [asset.id]);
      await utils.addSpaceMember(admin.accessToken, space.id, { userId: user2.userId });

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto(`/spaces/${space.id}`);

      // Open panel
      await page.locator('[data-testid="space-members-button"]').click();
      await expect(page.locator('[data-testid="space-panel"]')).toHaveClass(/translate-x-0/);

      // Activity tab is active by default — verify activity content is visible
      await expect(page.locator('[data-testid="space-panel"]')).toContainText('added 1 photos');

      // Switch to Members tab
      await page.locator('[data-testid="tab-members"]').click();
      await expect(page.locator('[data-testid="member-list"]')).toBeVisible();
      // Verify we can see both members
      await expect(page.locator('[data-testid="member-list"]')).toContainText('User Two');

      // Switch back to Activity tab
      await page.locator('[data-testid="tab-activity"]').click();
      // Verify activity content is visible again
      await expect(page.locator('[data-testid="space-panel"]')).toContainText('added 1 photos');
    });

    test('should show member count in Members tab label', async ({ context, page }) => {
      const space = await utils.createSpace(admin.accessToken, { name: 'Member Count Tab' });
      await utils.addSpaceMember(admin.accessToken, space.id, { userId: user2.userId });

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto(`/spaces/${space.id}`);

      await page.locator('[data-testid="space-members-button"]').click();
      // Members tab should show count (2 = admin + user2)
      await expect(page.locator('[data-testid="tab-members"]')).toContainText('Members (2)');
    });

    test('should close panel when close button is clicked', async ({ context, page }) => {
      const space = await utils.createSpace(admin.accessToken, { name: 'Close Panel Test' });

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto(`/spaces/${space.id}`);

      await page.locator('[data-testid="space-members-button"]').click();
      await expect(page.locator('[data-testid="space-panel"]')).toHaveClass(/translate-x-0/);

      await page.locator('[data-testid="panel-close"]').click();
      await expect(page.locator('[data-testid="space-panel"]')).toHaveClass(/translate-x-full/);
    });
  });

  test.describe('New-Since-Last-Visit Divider', () => {
    test('should show new assets divider when assets were added after last visit', async ({ context, page }) => {
      // User A (admin) creates space and adds User B
      const space = await utils.createSpace(admin.accessToken, { name: 'Divider Test' });
      await utils.addSpaceMember(admin.accessToken, space.id, { userId: user2.userId });

      // User B visits the space (marks as viewed via API)
      await utils.markSpaceViewed(user2.accessToken, space.id);

      // User A adds assets after User B's visit
      const asset1 = await utils.createAsset(admin.accessToken);
      const asset2 = await utils.createAsset(admin.accessToken);
      await utils.addSpaceAssets(admin.accessToken, space.id, [asset1.id, asset2.id]);

      // User B revisits the space in browser
      await utils.setAuthCookies(context, user2.accessToken);
      await page.goto(`/spaces/${space.id}`);

      // Verify the "X new" divider appears
      await expect(page.locator('[data-testid="new-assets-divider"]')).toBeVisible();
      await expect(page.locator('[data-testid="new-assets-pill"]')).toContainText('2 new');
    });

    test('should not show divider when no new assets since last visit', async ({ context, page }) => {
      const space = await utils.createSpace(admin.accessToken, { name: 'No Divider Test' });
      const asset = await utils.createAsset(admin.accessToken);
      await utils.addSpaceAssets(admin.accessToken, space.id, [asset.id]);

      // View after adding — so lastViewedAt is after asset addition
      await utils.markSpaceViewed(admin.accessToken, space.id);

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto(`/spaces/${space.id}`);

      await expect(page.locator('[data-testid="new-assets-divider"]')).not.toBeVisible();
    });

    test('should not show divider on first visit (no lastViewedAt)', async ({ context, page }) => {
      const space = await utils.createSpace(admin.accessToken, { name: 'First Visit Test' });
      const asset = await utils.createAsset(admin.accessToken);
      await utils.addSpaceAssets(admin.accessToken, space.id, [asset.id]);
      // Do NOT call markSpaceViewed — simulate first visit

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto(`/spaces/${space.id}`);

      // No divider on first visit because lastViewedAt is null
      await expect(page.locator('[data-testid="new-assets-divider"]')).not.toBeVisible();
    });
  });
});
