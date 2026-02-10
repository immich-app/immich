import type { AssetResponseDto } from '@immich/sdk';
import { expect, Page } from '@playwright/test';

function getAssetIdFromUrl(url: URL): string | null {
  const pathMatch = url.pathname.match(/\/memory\/photos\/([^/]+)/);
  if (pathMatch) {
    return pathMatch[1];
  }
  return url.searchParams.get('id');
}

export const memoryViewerUtils = {
  locator(page: Page) {
    return page.locator('#memory-viewer');
  },

  async waitForMemoryLoad(page: Page) {
    await expect(this.locator(page)).toBeVisible();
    await expect(page.locator('#memory-viewer img').first()).toBeVisible();
  },

  async openMemoryPage(page: Page) {
    await page.goto('/memory');
    await this.waitForMemoryLoad(page);
  },

  async openMemoryPageWithAsset(page: Page, assetId: string) {
    await page.goto(`/memory?id=${assetId}`);
    await this.waitForMemoryLoad(page);
  },
};

export const memoryGalleryUtils = {
  locator(page: Page) {
    return page.locator('#gallery-memory');
  },

  thumbnailWithAssetId(page: Page, assetId: string) {
    return page.locator(`#gallery-memory [data-thumbnail-focus-container][data-asset="${assetId}"]`);
  },

  async scrollToGallery(page: Page) {
    const showGalleryButton = page.getByLabel('Show gallery');
    if (await showGalleryButton.isVisible()) {
      await showGalleryButton.click();
    }
    await expect(this.locator(page)).toBeInViewport();
  },

  async clickThumbnail(page: Page, assetId: string) {
    await this.scrollToGallery(page);
    await this.thumbnailWithAssetId(page, assetId).click();
  },

  async getAllThumbnails(page: Page) {
    await this.scrollToGallery(page);
    return page.locator('#gallery-memory [data-thumbnail-focus-container]');
  },
};

export const memoryAssetViewerUtils = {
  locator(page: Page) {
    return page.locator('#immich-asset-viewer');
  },

  async waitForViewerOpen(page: Page) {
    await expect(this.locator(page)).toBeVisible();
  },

  async waitForAssetLoad(page: Page, asset: AssetResponseDto) {
    const viewer = this.locator(page);
    const imgLocator = viewer.locator(`img[draggable="false"][src*="/api/assets/${asset.id}/thumbnail?size=preview"]`);
    const videoLocator = viewer.locator(`video[poster*="/api/assets/${asset.id}/thumbnail?size=preview"]`);

    await imgLocator.or(videoLocator).waitFor({ timeout: 10_000 });
  },

  nextButton(page: Page) {
    return page.getByLabel('View next asset');
  },

  previousButton(page: Page) {
    return page.getByLabel('View previous asset');
  },

  async expectNextButtonVisible(page: Page) {
    await expect(this.nextButton(page)).toBeVisible();
  },

  async expectNextButtonNotVisible(page: Page) {
    await expect(this.nextButton(page)).toHaveCount(0);
  },

  async expectPreviousButtonVisible(page: Page) {
    await expect(this.previousButton(page)).toBeVisible();
  },

  async expectPreviousButtonNotVisible(page: Page) {
    await expect(this.previousButton(page)).toHaveCount(0);
  },

  async clickNextButton(page: Page) {
    await this.nextButton(page).click();
  },

  async clickPreviousButton(page: Page) {
    await this.previousButton(page).click();
  },

  async closeViewer(page: Page) {
    await page.keyboard.press('Escape');
    await expect(this.locator(page)).not.toBeVisible();
  },

  getCurrentAssetId(page: Page): string | null {
    const url = new URL(page.url());
    return getAssetIdFromUrl(url);
  },

  async expectCurrentAssetId(page: Page, expectedAssetId: string) {
    await expect.poll(() => this.getCurrentAssetId(page)).toBe(expectedAssetId);
  },
};
