import { expect, Page, test } from '@playwright/test';
import { SeededRandom, selectRandom, TimelineAssetConfig } from 'src/ui/generators/timeline';
import {
  createMockPeople,
  FaceCreateCapture,
  MockPerson,
  setupFaceEditorMockApiRoutes,
} from 'src/ui/mock-network/face-editor-network';
import { assetViewerUtils } from '../timeline/utils';
import { setupAssetViewerFixture } from './utils';

const waitForSelectorTransition = async (page: Page) => {
  await page.waitForFunction(
    () => {
      const selector = document.querySelector('#face-selector') as HTMLElement | null;
      if (!selector) {
        return false;
      }
      return selector.getAnimations({ subtree: false }).every((animation) => animation.playState === 'finished');
    },
    undefined,
    { timeout: 1000, polling: 50 },
  );
};

const openFaceEditor = async (page: Page, asset: TimelineAssetConfig) => {
  await page.goto(`/photos/${asset.id}`);
  await assetViewerUtils.waitForViewerLoad(page, asset);
  await page.keyboard.press('i');
  await page.locator('#detail-panel').waitFor({ state: 'visible' });
  await page.getByLabel('Tag people').click();
  await page.locator('#face-selector').waitFor({ state: 'visible' });
  await waitForSelectorTransition(page);
};

test.describe.configure({ mode: 'parallel' });
test.describe('face-editor', () => {
  const fixture = setupAssetViewerFixture(777);
  const rng = new SeededRandom(777);
  let mockPeople: MockPerson[];
  let faceCreateCapture: FaceCreateCapture;

  test.beforeAll(async () => {
    mockPeople = createMockPeople(8);
  });

  test.beforeEach(async ({ context }) => {
    faceCreateCapture = { requests: [] };
    await setupFaceEditorMockApiRoutes(context, mockPeople, faceCreateCapture);
  });

  type ScreenRect = { top: number; left: number; width: number; height: number };

  const getFaceBoxRect = async (page: Page): Promise<ScreenRect> => {
    const canvas = page.locator('#face-editor');
    await expect(canvas).toHaveAttribute('data-face-left', /^-?\d+/);
    await expect(canvas).toHaveAttribute('data-face-top', /^-?\d+/);
    await expect(canvas).toHaveAttribute('data-face-width', /^[1-9]/);
    await expect(canvas).toHaveAttribute('data-face-height', /^[1-9]/);
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) {
      throw new Error('Canvas element not found');
    }
    const left = Number(await canvas.getAttribute('data-face-left'));
    const top = Number(await canvas.getAttribute('data-face-top'));
    const width = Number(await canvas.getAttribute('data-face-width'));
    const height = Number(await canvas.getAttribute('data-face-height'));
    return {
      top: canvasBox.y + top,
      left: canvasBox.x + left,
      width,
      height,
    };
  };

  const getSelectorRect = async (page: Page): Promise<ScreenRect> => {
    const box = await page.locator('#face-selector').boundingBox();
    if (!box) {
      throw new Error('Face selector element not found');
    }
    return { top: box.y, left: box.x, width: box.width, height: box.height };
  };

  const computeOverlapArea = (a: ScreenRect, b: ScreenRect): number => {
    const overlapX = Math.max(0, Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left));
    const overlapY = Math.max(0, Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top));
    return overlapX * overlapY;
  };

  const dragFaceBox = async (page: Page, deltaX: number, deltaY: number) => {
    const faceBox = await getFaceBoxRect(page);
    const centerX = faceBox.left + faceBox.width / 2;
    const centerY = faceBox.top + faceBox.height / 2;
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + deltaX, centerY + deltaY, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(300);
  };

  test('Face editor opens with person list', async ({ page }) => {
    const asset = selectRandom(fixture.assets, rng);
    await openFaceEditor(page, asset);

    await expect(page.locator('#face-selector')).toBeVisible();
    await expect(page.locator('#face-editor')).toBeVisible();

    for (const person of mockPeople) {
      await expect(page.locator('#face-selector').getByText(person.name)).toBeVisible();
    }
  });

  test('Search filters people by name', async ({ page }) => {
    const asset = selectRandom(fixture.assets, rng);
    await openFaceEditor(page, asset);

    const searchInput = page.locator('#face-selector input');
    await searchInput.fill('Alice');

    await expect(page.locator('#face-selector').getByText('Alice Johnson')).toBeVisible();
    await expect(page.locator('#face-selector').getByText('Bob Smith')).toBeHidden();

    await searchInput.clear();

    for (const person of mockPeople) {
      await expect(page.locator('#face-selector').getByText(person.name)).toBeVisible();
    }
  });

  test('Search with no results shows empty message', async ({ page }) => {
    const asset = selectRandom(fixture.assets, rng);
    await openFaceEditor(page, asset);

    const searchInput = page.locator('#face-selector input');
    await searchInput.fill('Nonexistent Person XYZ');

    for (const person of mockPeople) {
      await expect(page.locator('#face-selector').getByText(person.name)).toBeHidden();
    }
  });

  test('Selecting a person shows confirmation dialog', async ({ page }) => {
    const asset = selectRandom(fixture.assets, rng);
    await openFaceEditor(page, asset);

    const personToTag = mockPeople[0];
    await page.locator('#face-selector').getByText(personToTag.name).click();

    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('Confirming tag calls createFace API and closes editor', async ({ page }) => {
    const asset = selectRandom(fixture.assets, rng);
    await openFaceEditor(page, asset);

    const personToTag = mockPeople[0];
    await page.locator('#face-selector').getByText(personToTag.name).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /confirm/i }).click();

    await expect(page.locator('#face-selector')).toBeHidden();
    await expect(page.locator('#face-editor')).toBeHidden();

    expect(faceCreateCapture.requests).toHaveLength(1);
    expect(faceCreateCapture.requests[0].assetId).toBe(asset.id);
    expect(faceCreateCapture.requests[0].personId).toBe(personToTag.id);
  });

  test('Cancel button closes face editor', async ({ page }) => {
    const asset = selectRandom(fixture.assets, rng);
    await openFaceEditor(page, asset);

    await expect(page.locator('#face-selector')).toBeVisible();
    await expect(page.locator('#face-editor')).toBeVisible();

    await page.getByRole('button', { name: /cancel/i }).click();

    await expect(page.locator('#face-selector')).toBeHidden();
    await expect(page.locator('#face-editor')).toBeHidden();
  });

  test('Selector does not overlap face box on initial open', async ({ page }) => {
    const asset = selectRandom(fixture.assets, rng);
    await openFaceEditor(page, asset);

    const faceBox = await getFaceBoxRect(page);
    const selectorBox = await getSelectorRect(page);
    const overlap = computeOverlapArea(faceBox, selectorBox);

    expect(overlap).toBe(0);
  });

  test('Selector repositions without overlap after dragging face box down', async ({ page }) => {
    const asset = selectRandom(fixture.assets, rng);
    await openFaceEditor(page, asset);

    await dragFaceBox(page, 0, 150);

    const faceBox = await getFaceBoxRect(page);
    const selectorBox = await getSelectorRect(page);
    const overlap = computeOverlapArea(faceBox, selectorBox);

    expect(overlap).toBe(0);
  });

  test('Selector repositions without overlap after dragging face box right', async ({ page }) => {
    const asset = selectRandom(fixture.assets, rng);
    await openFaceEditor(page, asset);

    await dragFaceBox(page, 200, 0);

    const faceBox = await getFaceBoxRect(page);
    const selectorBox = await getSelectorRect(page);
    const overlap = computeOverlapArea(faceBox, selectorBox);

    expect(overlap).toBe(0);
  });

  test('Selector repositions without overlap after dragging face box to top-left corner', async ({ page }) => {
    const asset = selectRandom(fixture.assets, rng);
    await openFaceEditor(page, asset);

    await dragFaceBox(page, -300, -300);

    const faceBox = await getFaceBoxRect(page);
    const selectorBox = await getSelectorRect(page);
    const overlap = computeOverlapArea(faceBox, selectorBox);

    expect(overlap).toBe(0);
  });

  test('Selector repositions without overlap after dragging face box to bottom-right', async ({ page }) => {
    const asset = selectRandom(fixture.assets, rng);
    await openFaceEditor(page, asset);

    await dragFaceBox(page, 300, 300);

    const faceBox = await getFaceBoxRect(page);
    const selectorBox = await getSelectorRect(page);
    const overlap = computeOverlapArea(faceBox, selectorBox);

    expect(overlap).toBe(0);
  });

  test('Selector stays within viewport bounds', async ({ page }) => {
    const asset = selectRandom(fixture.assets, rng);
    await openFaceEditor(page, asset);

    const viewportSize = page.viewportSize()!;
    const selectorBox = await getSelectorRect(page);

    expect(selectorBox.top).toBeGreaterThanOrEqual(0);
    expect(selectorBox.left).toBeGreaterThanOrEqual(0);
    expect(selectorBox.top + selectorBox.height).toBeLessThanOrEqual(viewportSize.height);
    expect(selectorBox.left + selectorBox.width).toBeLessThanOrEqual(viewportSize.width);
  });

  test('Selector stays within viewport after dragging to edge', async ({ page }) => {
    const asset = selectRandom(fixture.assets, rng);
    await openFaceEditor(page, asset);

    await dragFaceBox(page, -400, -400);

    const viewportSize = page.viewportSize()!;
    const selectorBox = await getSelectorRect(page);

    expect(selectorBox.top).toBeGreaterThanOrEqual(0);
    expect(selectorBox.left).toBeGreaterThanOrEqual(0);
    expect(selectorBox.top + selectorBox.height).toBeLessThanOrEqual(viewportSize.height);
    expect(selectorBox.left + selectorBox.width).toBeLessThanOrEqual(viewportSize.width);
  });

  test('Face box is draggable on the canvas', async ({ page }) => {
    const asset = selectRandom(fixture.assets, rng);
    await openFaceEditor(page, asset);

    const beforeDrag = await getFaceBoxRect(page);
    await dragFaceBox(page, 100, 50);
    const afterDrag = await getFaceBoxRect(page);

    expect(afterDrag.left).toBeGreaterThan(beforeDrag.left + 50);
    expect(afterDrag.top).toBeGreaterThan(beforeDrag.top + 20);
  });
});
