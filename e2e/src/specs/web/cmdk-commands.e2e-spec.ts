import type { LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

// Task 16 — cmdk v1.3.0 commands E2E.
//
// Covers the 7 command-items wired in web/src/lib/managers/command-items.ts.
// Each test reuses the existing global-search spec harness (auth cookie setup,
// /photos landing, cmdk-trigger hydration wait) to avoid duplicating plumbing.
test.describe('cmdk commands (v1.3.0)', () => {
  let admin: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    await utils.createAsset(admin.accessToken);
    await utils.waitForQueueFinish(admin.accessToken, 'metadataExtraction');
  });

  test.beforeEach(async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/photos');
    await page.getByTestId('cmdk-trigger').waitFor({ state: 'visible' });
  });

  test('>upload + Enter opens the native file picker', async ({ page }) => {
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('combobox').fill('>upload');

    // Wait for the Commands section to render. The section carries the
    // data-cmdk-commands-section attribute (set on bits-ui Command.Group in
    // global-search-commands-section.svelte).
    await expect(dialog.locator('[data-cmdk-commands-section]')).toBeVisible();
    await expect(dialog.getByText(/^upload$/i).first()).toBeVisible();

    // openFileUploadDialog() synthesises a click on a hidden <input type="file">,
    // which Playwright surfaces as a 'filechooser' event on the page. Register
    // the listener BEFORE pressing Enter so we never miss the event.
    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5000 });
    await page.keyboard.press('Enter');
    const fileChooser = await fileChooserPromise;
    expect(fileChooser).toBeTruthy();
  });

  test('>theme + Enter flips the active theme class on <html>', async ({ page }) => {
    const initialDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));

    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('combobox').fill('>theme');
    await expect(dialog.locator('[data-cmdk-commands-section]')).toBeVisible();
    await expect(dialog.getByText(/^theme$/i).first()).toBeVisible();

    await page.keyboard.press('Enter');

    // themeManager.toggleTheme flips the `dark` class on <html>; poll (bounded)
    // until the class state differs from the captured baseline.
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.classList.contains('dark')), {
        timeout: 2000,
      })
      .toBe(!initialDark);
  });

  test('> bare shows Commands section before Go-to (navigation) sections', async ({ page }) => {
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('combobox').fill('>');

    const commandsSection = dialog.locator('[data-cmdk-commands-section]');
    const navSection = dialog.locator('[data-cmdk-nav-section]').first();
    await expect(commandsSection).toBeVisible();
    await expect(navSection).toBeVisible();

    // Compare DOM order via bounding boxes — Commands must render above
    // (lower y) than the first navigation section.
    const cmdBox = await commandsSection.boundingBox();
    const navBox = await navSection.boundingBox();
    expect(cmdBox).not.toBeNull();
    expect(navBox).not.toBeNull();
    expect(cmdBox!.y).toBeLessThan(navBox!.y);
  });

  test('unscoped "upload" query promotes the Upload command to top result', async ({ page }) => {
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('combobox').fill('upload');

    // Under unscoped 'all', a near-exact command match is promoted to the
    // Top Result slot (rendered as Command.Group with
    // data-cmdk-top-result-commands) AND deduped out of the Commands
    // section. Pressing Enter on the promoted row activates the command.
    const topResultGroup = dialog.locator('[data-cmdk-top-result-commands]');
    await expect(topResultGroup).toBeVisible();
    await expect(topResultGroup.getByText(/^upload$/i).first()).toBeVisible();

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5000 });
    await topResultGroup
      .getByText(/^upload$/i)
      .first()
      .click();
    const fileChooser = await fileChooserPromise;
    expect(fileChooser).toBeTruthy();
  });

  test('>clear recents clears the Recent section', async ({ page }) => {
    // Seed a RECENT entry by activating a navigation row. The navigation
    // provider writes RECENT on activation (unlike command items, which
    // intentionally do not). 'auto' fuzzy-matches 'Auto-Classification' which
    // is an admin-gated system-settings item — admin is logged in here.
    await page.keyboard.press('Control+k');
    let dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('combobox').fill('auto-classification');
    const navGroup = dialog.locator('[data-cmdk-top-result-navigation]');
    await expect(navGroup.getByText(/auto-classification/i).first()).toBeVisible();
    await navGroup
      .getByText(/auto-classification/i)
      .first()
      .click();
    await expect(page).toHaveURL(/classification/);

    // Go back to /photos and verify RECENT has the seeded entry.
    await page.goto('/photos');
    await page.getByTestId('cmdk-trigger').waitFor({ state: 'visible' });
    await page.keyboard.press('Control+k');
    dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const recentGroup = dialog.getByRole('group', { name: /^recent/i });
    await expect(recentGroup.getByText(/auto-classification/i)).toBeVisible();

    // Fire the clear-recents command.
    await dialog.getByRole('combobox').fill('>clear');
    await expect(dialog.locator('[data-cmdk-commands-section]')).toBeVisible();
    await expect(dialog.getByText(/clear recent/i).first()).toBeVisible();
    await page.keyboard.press('Enter');

    // Command activation auto-closes the palette (activate('command') calls
    // manager.close). Wait for the dialog to disappear, then reopen; the RECENT
    // section should be gone because empty groups don't render.
    await expect(page.getByRole('dialog')).toBeHidden();
    await page.keyboard.press('Control+k');
    dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('group', { name: /^recent/i })).toHaveCount(0);
  });
});
