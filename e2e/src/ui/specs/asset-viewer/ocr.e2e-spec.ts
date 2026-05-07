import type { AssetOcrResponseDto, AssetResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { toAssetResponseDto } from 'src/ui/generators/timeline';
import {
  createMockStack,
  createMockStackAsset,
  MockStack,
  setupBrokenAssetMockApiRoutes,
} from 'src/ui/mock-network/broken-asset-network';
import { createMockOcrData, setupOcrMockApiRoutes } from 'src/ui/mock-network/ocr-network';
import { assetViewerUtils } from '../timeline/utils';
import { setupAssetViewerFixture } from './utils';

test.describe.configure({ mode: 'parallel' });

const PRIMARY_OCR_BOXES = [
  { text: 'Hello World', x1: 0.1, y1: 0.1, x2: 0.4, y2: 0.1, x3: 0.4, y3: 0.15, x4: 0.1, y4: 0.15 },
  { text: 'Immich Photo', x1: 0.2, y1: 0.3, x2: 0.6, y2: 0.3, x3: 0.6, y3: 0.36, x4: 0.2, y4: 0.36 },
];

const SECONDARY_OCR_BOXES = [
  { text: 'Second Asset Text', x1: 0.15, y1: 0.2, x2: 0.55, y2: 0.2, x3: 0.55, y3: 0.26, x4: 0.15, y4: 0.26 },
];

test.describe('OCR bounding boxes', () => {
  const fixture = setupAssetViewerFixture(920);

  test.beforeEach(async ({ context }) => {
    const primaryAssetDto = toAssetResponseDto(fixture.primaryAsset);
    const ocrDataByAssetId = new Map<string, AssetOcrResponseDto[]>([
      [primaryAssetDto.id, createMockOcrData(primaryAssetDto.id, PRIMARY_OCR_BOXES)],
    ]);

    await setupOcrMockApiRoutes(context, ocrDataByAssetId);
  });

  test('OCR bounding boxes appear when clicking OCR button', async ({ page }) => {
    await page.goto(`/photos/${fixture.primaryAsset.id}`);
    await assetViewerUtils.waitForViewerLoad(page, fixture.primaryAsset);

    const ocrButton = page.getByLabel('Text recognition');
    await expect(ocrButton).toBeVisible();
    await ocrButton.click();

    const ocrBoxes = page.locator('[data-viewer-content] [data-testid="ocr-box"]');
    await expect(ocrBoxes).toHaveCount(2);

    await expect(ocrBoxes.nth(0)).toContainText('Hello World');
    await expect(ocrBoxes.nth(1)).toContainText('Immich Photo');
  });

  test('OCR bounding boxes toggle off on second click', async ({ page }) => {
    await page.goto(`/photos/${fixture.primaryAsset.id}`);
    await assetViewerUtils.waitForViewerLoad(page, fixture.primaryAsset);

    const ocrButton = page.getByLabel('Text recognition');
    await ocrButton.click();
    await expect(page.locator('[data-viewer-content] [data-testid="ocr-box"]').first()).toBeVisible();

    await ocrButton.click();
    await expect(page.locator('[data-viewer-content] [data-testid="ocr-box"]')).toHaveCount(0);
  });
});

test.describe('OCR with stacked assets', () => {
  const fixture = setupAssetViewerFixture(921);
  let mockStack: MockStack;
  let primaryAssetDto: AssetResponseDto;
  let secondAssetDto: AssetResponseDto;

  test.beforeAll(async () => {
    primaryAssetDto = toAssetResponseDto(fixture.primaryAsset);
    secondAssetDto = createMockStackAsset(fixture.adminUserId);
    secondAssetDto.originalFileName = 'second-ocr-asset.jpg';
    mockStack = createMockStack(primaryAssetDto, [secondAssetDto], new Set());
  });

  test.beforeEach(async ({ context }) => {
    await setupBrokenAssetMockApiRoutes(context, mockStack);

    const ocrDataByAssetId = new Map<string, AssetOcrResponseDto[]>([
      [primaryAssetDto.id, createMockOcrData(primaryAssetDto.id, PRIMARY_OCR_BOXES)],
      [secondAssetDto.id, createMockOcrData(secondAssetDto.id, SECONDARY_OCR_BOXES)],
    ]);

    await setupOcrMockApiRoutes(context, ocrDataByAssetId);
  });

  test('different OCR boxes shown for different stacked assets', async ({ page }) => {
    await page.goto(`/photos/${fixture.primaryAsset.id}`);
    await assetViewerUtils.waitForViewerLoad(page, fixture.primaryAsset);

    const ocrButton = page.getByLabel('Text recognition');
    await expect(ocrButton).toBeVisible();
    await ocrButton.click();

    const ocrBoxes = page.locator('[data-viewer-content] [data-testid="ocr-box"]');
    await expect(ocrBoxes).toHaveCount(2);
    await expect(ocrBoxes.nth(0)).toContainText('Hello World');

    const stackThumbnails = page.locator('#stack-slideshow [data-asset]');
    await expect(stackThumbnails).toHaveCount(2);
    await stackThumbnails.nth(1).click();

    // refreshOcr() clears showOverlay when switching assets, so re-enable it
    await expect(ocrBoxes).toHaveCount(0);
    await expect(ocrButton).toBeVisible();
    await ocrButton.click();

    await expect(ocrBoxes).toHaveCount(1);
    await expect(ocrBoxes.first()).toContainText('Second Asset Text');
  });
});

test.describe('OCR boxes and zoom', () => {
  const fixture = setupAssetViewerFixture(922);

  test.beforeEach(async ({ context }) => {
    const primaryAssetDto = toAssetResponseDto(fixture.primaryAsset);
    const ocrDataByAssetId = new Map<string, AssetOcrResponseDto[]>([
      [primaryAssetDto.id, createMockOcrData(primaryAssetDto.id, PRIMARY_OCR_BOXES)],
    ]);

    await setupOcrMockApiRoutes(context, ocrDataByAssetId);
  });

  test('OCR boxes scale with zoom', async ({ page }) => {
    await page.goto(`/photos/${fixture.primaryAsset.id}`);
    await assetViewerUtils.waitForViewerLoad(page, fixture.primaryAsset);

    const ocrButton = page.getByLabel('Text recognition');
    await expect(ocrButton).toBeVisible();
    await ocrButton.click();

    const ocrBox = page.locator('[data-viewer-content] [data-testid="ocr-box"]').first();
    await expect(ocrBox).toBeVisible();

    const initialBox = await ocrBox.boundingBox();
    expect(initialBox).toBeTruthy();

    const { width, height } = page.viewportSize()!;
    await page.mouse.move(width / 2, height / 2);
    await page.mouse.wheel(0, -3);

    await expect(async () => {
      const zoomedBox = await ocrBox.boundingBox();
      expect(zoomedBox).toBeTruthy();
      expect(zoomedBox!.width).toBeGreaterThan(initialBox!.width);
      expect(zoomedBox!.height).toBeGreaterThan(initialBox!.height);
    }).toPass({ timeout: 2000 });
  });
});

test.describe('OCR text interaction', () => {
  const fixture = setupAssetViewerFixture(923);

  test.beforeEach(async ({ context }) => {
    const primaryAssetDto = toAssetResponseDto(fixture.primaryAsset);
    const ocrDataByAssetId = new Map<string, AssetOcrResponseDto[]>([
      [primaryAssetDto.id, createMockOcrData(primaryAssetDto.id, PRIMARY_OCR_BOXES)],
    ]);

    await setupOcrMockApiRoutes(context, ocrDataByAssetId);
  });

  test('OCR text box has data-overlay-interactive attribute', async ({ page }) => {
    await page.goto(`/photos/${fixture.primaryAsset.id}`);
    await assetViewerUtils.waitForViewerLoad(page, fixture.primaryAsset);

    await page.getByLabel('Text recognition').click();

    const ocrBox = page.locator('[data-viewer-content] [data-testid="ocr-box"]').first();
    await expect(ocrBox).toBeVisible();
    await expect(ocrBox).toHaveAttribute('data-overlay-interactive');
  });

  test('OCR text box receives focus on click', async ({ page }) => {
    await page.goto(`/photos/${fixture.primaryAsset.id}`);
    await assetViewerUtils.waitForViewerLoad(page, fixture.primaryAsset);

    await page.getByLabel('Text recognition').click();

    const ocrBox = page.locator('[data-viewer-content] [data-testid="ocr-box"]').first();
    await expect(ocrBox).toBeVisible();

    await ocrBox.click();
    await expect(ocrBox).toBeFocused();
  });

  test('dragging on OCR text box does not trigger image pan', async ({ page }) => {
    await page.goto(`/photos/${fixture.primaryAsset.id}`);
    await assetViewerUtils.waitForViewerLoad(page, fixture.primaryAsset);

    await page.getByLabel('Text recognition').click();

    const ocrBox = page.locator('[data-viewer-content] [data-testid="ocr-box"]').first();
    await expect(ocrBox).toBeVisible();

    const imgLocator = page.locator('[data-viewer-content] img[draggable="false"]');
    const initialTransform = await imgLocator.evaluate((element) => {
      return getComputedStyle(element.closest('[style*="transform"]') ?? element).transform;
    });

    const box = await ocrBox.boundingBox();
    expect(box).toBeTruthy();
    const centerX = box!.x + box!.width / 2;
    const centerY = box!.y + box!.height / 2;

    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 50, centerY + 30, { steps: 5 });
    await page.mouse.up();

    const afterTransform = await imgLocator.evaluate((element) => {
      return getComputedStyle(element.closest('[style*="transform"]') ?? element).transform;
    });
    expect(afterTransform).toBe(initialTransform);
  });

  test('split touch gesture across zoom container does not trigger zoom', async ({ page }) => {
    await page.goto(`/photos/${fixture.primaryAsset.id}`);
    await assetViewerUtils.waitForViewerLoad(page, fixture.primaryAsset);

    await page.getByLabel('Text recognition').click();
    const ocrBox = page.locator('[data-viewer-content] [data-testid="ocr-box"]').first();
    await expect(ocrBox).toBeVisible();

    const imgLocator = page.locator('[data-viewer-content] img[draggable="false"]');
    const initialTransform = await imgLocator.evaluate((element) => {
      return getComputedStyle(element.closest('[style*="transform"]') ?? element).transform;
    });

    const viewerContent = page.locator('[data-viewer-content]');
    const viewerBox = await viewerContent.boundingBox();
    expect(viewerBox).toBeTruthy();

    // Dispatch a synthetic split gesture: one touch inside the viewer, one outside
    await page.evaluate(
      ({ viewerCenterX, viewerCenterY, outsideY }) => {
        const viewer = document.querySelector('[data-viewer-content]');
        if (!viewer) {
          return;
        }

        const createTouch = (id: number, x: number, y: number) => {
          return new Touch({
            identifier: id,
            target: viewer,
            clientX: x,
            clientY: y,
          });
        };

        const insideTouch = createTouch(0, viewerCenterX, viewerCenterY);
        const outsideTouch = createTouch(1, viewerCenterX, outsideY);

        const touchStartEvent = new TouchEvent('touchstart', {
          touches: [insideTouch, outsideTouch],
          targetTouches: [insideTouch],
          changedTouches: [insideTouch, outsideTouch],
          bubbles: true,
          cancelable: true,
        });

        const touchMoveEvent = new TouchEvent('touchmove', {
          touches: [createTouch(0, viewerCenterX, viewerCenterY - 30), createTouch(1, viewerCenterX, outsideY + 30)],
          targetTouches: [createTouch(0, viewerCenterX, viewerCenterY - 30)],
          changedTouches: [
            createTouch(0, viewerCenterX, viewerCenterY - 30),
            createTouch(1, viewerCenterX, outsideY + 30),
          ],
          bubbles: true,
          cancelable: true,
        });

        const touchEndEvent = new TouchEvent('touchend', {
          touches: [],
          targetTouches: [],
          changedTouches: [insideTouch, outsideTouch],
          bubbles: true,
          cancelable: true,
        });

        viewer.dispatchEvent(touchStartEvent);
        viewer.dispatchEvent(touchMoveEvent);
        viewer.dispatchEvent(touchEndEvent);
      },
      {
        viewerCenterX: viewerBox!.x + viewerBox!.width / 2,
        viewerCenterY: viewerBox!.y + viewerBox!.height / 2,
        outsideY: 10, // near the top of the page, outside the viewer
      },
    );

    const afterTransform = await imgLocator.evaluate((element) => {
      return getComputedStyle(element.closest('[style*="transform"]') ?? element).transform;
    });
    expect(afterTransform).toBe(initialTransform);
  });
});
