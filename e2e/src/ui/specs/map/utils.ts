import { ConsoleMessage, expect, Locator, Page } from '@playwright/test';

export const mapUtils = {
  getClusters(page: Page) {
    return page.locator('[class*="rounded-full"][class*="bg-immich-primary"]').filter({ hasText: /\d+/ });
  },

  getFirstCluster(page: Page) {
    return this.getClusters(page).first();
  },

  async getClusterCount(page: Page, clusterElement?: Locator) {
    const element = clusterElement || this.getFirstCluster(page);
    await expect(element).toBeVisible();
    await expect(element).toHaveText(/\d+/);
    const text = await element.textContent();
    return Number.parseInt((text ?? '').replaceAll(/[^\d]/g, ''), 10);
  },

  async expectMapVisible(page: Page) {
    const mapContainer = page.locator('.rounded-none.h-full');
    await expect(mapContainer).toBeVisible();
  },

  async expectClustersVisible(page: Page, minCount = 1) {
    const clusters = this.getClusters(page);
    const count = await clusters.count();
    expect(count).toBeGreaterThanOrEqual(minCount);
  },

  getZoomInButton(page: Page) {
    return page.getByLabel(/zoom in/i);
  },

  getZoomOutButton(page: Page) {
    return page.getByLabel(/zoom out/i);
  },

  getSettingsButton(page: Page) {
    return page.getByRole('button', { name: /map settings/i });
  },

  getTimelineButton(page: Page) {
    return page.getByRole('button', { name: /timeline/i });
  },

  async expectMapControlsVisible(page: Page) {
    await expect(this.getZoomInButton(page)).toBeVisible();
    await expect(this.getZoomOutButton(page)).toBeVisible();
    await expect(this.getSettingsButton(page)).toBeVisible();
  },

  async zoomIn(page: Page) {
    await this.getZoomInButton(page).click();
    await page.waitForTimeout(500);
  },

  async zoomOut(page: Page) {
    await this.getZoomOutButton(page).click();
    await page.waitForTimeout(500);
  },

  async waitForMarkersAPI(page: Page) {
    return page.waitForResponse((response) => response.url().includes('/api/map/markers') && response.status() === 200);
  },

  async navigateToMap(page: Page) {
    await page.goto('/map');
    await page.waitForLoadState('networkidle');
  },

  async captureConsoleErrors(page: Page, callback: () => Promise<void>) {
    const errors: string[] = [];
    const handler = (msg: ConsoleMessage) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore expected MapLibre external styles 401 in ci/cd
        if (text.includes('401 (Unauthorized)')) {
          return;
        }
        errors.push(text);
      }
    };

    page.on('console', handler);
    await callback();
    page.off('console', handler);

    return errors;
  },
};
