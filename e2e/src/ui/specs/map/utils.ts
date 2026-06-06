import { ConsoleMessage, expect, Locator, Page } from '@playwright/test';

/**
 * Map testing utilities for e2e tests
 */

export const mapUtils = {
  /**
   * Get all visible cluster on the map
   */
  getClusters(page: Page) {
    return page.locator('[class*="rounded-full"][class*="bg-immich-primary"]').filter({ hasText: /\d+/ });
  },

  /**
   * Get the first visible cluster button
   */
  getFirstCluster(page: Page) {
    return this.getClusters(page).first();
  },

  /**
   * Get asset count of a cluster
   */
  async getClusterCount(page: Page, clusterElement?: Locator) {
    const element = clusterElement || this.getFirstCluster(page);
    await expect(element).toBeVisible();
    await expect(element).toHaveText(/\d+/);
    const text = await element.textContent();
    return Number.parseInt((text ?? '').replaceAll(/[^\d]/g, ''), 10);
  },

  /**
   * Click on a cluster
   */
  async clickCluster(page: Page, clusterElement?: Locator, waitMs = 1500) {
    const element = clusterElement || this.getFirstCluster(page);
    await element.scrollIntoViewIfNeeded();
    await element.click({ force: true });
    await page.waitForTimeout(waitMs);
  },

  /**
   * Verify map is visible and loaded
   */
  async expectMapVisible(page: Page) {
    const mapContainer = page.locator('.rounded-none.h-full');
    await expect(mapContainer).toBeVisible();
  },

  /**
   * Verify clusters exist on map
   */
  async expectClustersVisible(page: Page, minCount = 1) {
    const clusters = this.getClusters(page);
    const count = await clusters.count();
    expect(count).toBeGreaterThanOrEqual(minCount);
  },

  /**
   * Get map control buttons
   */
  getZoomInButton(page: Page) {
    return page.getByLabel(/zoom in/i);
  },

  getZoomOutButton(page: Page) {
    return page.getByLabel(/zoom out/i);
  },

  getSettingsButton(page: Page) {
    return page.getByLabel(/map settings/i);
  },



  /**
   * Verify all standard map controls are visible
   */
  async expectMapControlsVisible(page: Page) {
    await expect(this.getZoomInButton(page)).toBeVisible();
    await expect(this.getZoomOutButton(page)).toBeVisible();
    await expect(this.getSettingsButton(page)).toBeVisible();
  },

  /**
   * Click zoom in button
   */
  async zoomIn(page: Page) {
    await this.getZoomInButton(page).click();
    await page.waitForTimeout(500);
  },

  /**
   * Click zoom out button
   */
  async zoomOut(page: Page) {
    await this.getZoomOutButton(page).click();
    await page.waitForTimeout(500);
  },

  /**
   * Wait for markers API to respond
   */
  async waitForMarkersAPI(page: Page) {
    return page.waitForResponse((response) => response.url().includes('/api/map/markers') && response.status() === 200);
  },

  /**
   * Navigate to map and wait for load
   */
  async navigateToMap(page: Page) {
    await page.goto('/map');
    await page.waitForLoadState('networkidle');
  },

  /**
   * Check if map has any errors
   */
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
