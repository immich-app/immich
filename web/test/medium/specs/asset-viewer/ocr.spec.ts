import { Route } from '#lib/route.ts';
import { expect, test, type MockData } from '#test/medium/fixtures.ts';
import { factory } from '#test/medium/mock/factories.ts';
import type { Page } from '@playwright/test';

const helloWorld = { text: 'Hello World', x1: 0.1, y1: 0.1, x2: 0.4, y2: 0.1, x3: 0.4, y3: 0.15, x4: 0.1, y4: 0.15 };
const immichPhoto = { text: 'Immich Photo', x1: 0.2, y1: 0.3, x2: 0.6, y2: 0.3, x3: 0.6, y3: 0.36, x4: 0.2, y4: 0.36 };
const secondText = {
  text: 'Second Asset Text',
  x1: 0.15,
  y1: 0.2,
  x2: 0.55,
  y2: 0.2,
  x3: 0.55,
  y3: 0.26,
  x4: 0.15,
  y4: 0.26,
};

const setup = (data: MockData) => {
  const asset = factory.asset({ width: 4000, height: 3000 });
  data
    .addAsset(asset)
    .addOcr(factory.ocr({ assetId: asset.id, ...helloWorld }), factory.ocr({ assetId: asset.id, ...immichPhoto }));
  return asset;
};

const dispatchSplitTouch = (page: Page, box: { x: number; y: number; width: number; height: number }) =>
  page.evaluate(
    ({ centerX, centerY, outsideY }) => {
      const target = document.querySelector('[data-viewer-content]');
      if (!target) {
        return;
      }
      const touch = (identifier: number, clientY: number) =>
        new Touch({ identifier, target, clientX: centerX, clientY });
      const inside = touch(0, centerY);
      const outside = touch(1, outsideY);
      const options = { bubbles: true, cancelable: true };

      target.dispatchEvent(
        new TouchEvent('touchstart', {
          ...options,
          touches: [inside, outside],
          targetTouches: [inside],
          changedTouches: [inside, outside],
        }),
      );
      target.dispatchEvent(
        new TouchEvent('touchmove', {
          ...options,
          touches: [touch(0, centerY - 30), touch(1, outsideY + 30)],
          targetTouches: [touch(0, centerY - 30)],
          changedTouches: [touch(0, centerY - 30), touch(1, outsideY + 30)],
        }),
      );
      target.dispatchEvent(
        new TouchEvent('touchend', { ...options, touches: [], targetTouches: [], changedTouches: [inside, outside] }),
      );
    },
    { centerX: box.x + box.width / 2, centerY: box.y + box.height / 2, outsideY: 10 },
  );

test.describe('OCR bounding boxes', () => {
  test('toggle with the OCR button and show the recognized text', async ({ page, data, app }) => {
    const asset = setup(data);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);

    await app.viewer.ocr.button.click();
    await expect(app.viewer.ocr.boxes).toHaveCount(2);
    await expect(app.viewer.ocr.boxes.nth(0)).toContainText('Hello World');
    await expect(app.viewer.ocr.boxes.nth(1)).toContainText('Immich Photo');

    await app.viewer.ocr.button.click();
    await expect(app.viewer.ocr.boxes).toHaveCount(0);
  });

  test('differ between stacked assets', async ({ page, data, app }) => {
    const primary = setup(data);
    const second = factory.asset({ originalFileName: 'second-ocr-asset.jpg' });
    data
      .addStack(factory.stack({ assets: [primary, second] }))
      .addOcr(factory.ocr({ assetId: second.id, ...secondText }));
    await page.goto(Route.viewAsset({ id: primary.id }));
    await app.viewer.waitForAsset(primary);

    await app.viewer.ocr.button.click();
    await expect(app.viewer.ocr.boxes).toHaveCount(2);
    await expect(app.viewer.ocr.boxes.first()).toContainText('Hello World');

    await app.viewer.stackThumbnail(second).click();
    await expect(app.viewer.ocr.boxes).toHaveCount(0);

    await app.viewer.ocr.button.click();
    await expect(app.viewer.ocr.boxes).toHaveCount(1);
    await expect(app.viewer.ocr.boxes.first()).toContainText('Second Asset Text');
  });

  test('scale with zoom', async ({ page, data, app }) => {
    const asset = setup(data);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);
    await app.viewer.ocr.button.click();
    const box = app.viewer.ocr.boxes.first();
    await expect(box).toBeVisible();
    const initial = (await box.boundingBox())!;

    const { width, height } = page.viewportSize()!;
    await page.mouse.move(width / 2, height / 2);
    await page.mouse.wheel(0, -3);

    await expect(async () => {
      const zoomed = (await box.boundingBox())!;
      expect(zoomed.width).toBeGreaterThan(initial.width);
      expect(zoomed.height).toBeGreaterThan(initial.height);
    }).toPass({ timeout: 2000 });
  });

  test('are interactive overlays that take focus and swallow pointer gestures', async ({ page, data, app }) => {
    const asset = setup(data);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);
    await app.viewer.ocr.button.click();
    const box = app.viewer.ocr.boxes.first();
    await expect(box).toBeVisible();
    await expect(box).toHaveAttribute('data-overlay-interactive');

    await box.click();
    await expect(box).toBeFocused();

    const initialTransform = await app.viewer.ocr.imageTransform();
    const bounds = (await box.boundingBox())!;
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 50, centerY + 30, { steps: 5 });
    await page.mouse.up();
    expect(await app.viewer.ocr.imageTransform()).toBe(initialTransform);

    await dispatchSplitTouch(page, (await app.viewer.content.boundingBox())!);
    expect(await app.viewer.ocr.imageTransform()).toBe(initialTransform);
  });
});
