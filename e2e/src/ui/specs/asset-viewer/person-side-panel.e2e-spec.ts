import { expect, Page, test } from '@playwright/test';
import {
  createMockAssetFaces,
  createMockFacePeople,
  createMockPeople,
  type MockFaceSpec,
  setupAssetWithPeopleMockRoute,
  setupFaceEditorMockApiRoutes,
  setupGetFacesMockApiRoute,
} from 'src/ui/mock-network/face-editor-network';
import { assetViewerUtils } from '../timeline/utils';
import { ensureDetailPanelVisible, setupAssetViewerFixture } from './utils';

const FACE_SPECS: MockFaceSpec[] = [
  {
    personId: 'person-alice',
    personName: 'Alice Johnson',
    faceId: 'face-alice',
    boundingBoxX1: 1000,
    boundingBoxY1: 500,
    boundingBoxX2: 1500,
    boundingBoxY2: 1200,
  },
  {
    personId: 'person-bob',
    personName: 'Bob Smith',
    faceId: 'face-bob',
    boundingBoxX1: 2000,
    boundingBoxY1: 800,
    boundingBoxX2: 2400,
    boundingBoxY2: 1600,
  },
];

const openPersonSidePanel = async (page: Page) => {
  await ensureDetailPanelVisible(page);
  await page.getByLabel('Edit people').click();
  await page.getByText('Edit faces').waitFor({ state: 'visible' });
};

test.describe.configure({ mode: 'parallel' });
test.describe('person-side-panel escape shortcuts', () => {
  const fixture = setupAssetViewerFixture(850);

  test.beforeEach(async ({ context }) => {
    const imageWidth = fixture.primaryAssetDto.width ?? 4000;
    const imageHeight = fixture.primaryAssetDto.height ?? 3000;

    const people = createMockFacePeople(FACE_SPECS, imageWidth, imageHeight);
    const assetDtoWithPeople = {
      ...fixture.primaryAssetDto,
      people,
      unassignedFaces: [],
    };

    const assetFaces = createMockAssetFaces(FACE_SPECS, imageWidth, imageHeight);

    await setupAssetWithPeopleMockRoute(context, assetDtoWithPeople);
    await setupGetFacesMockApiRoute(context, assetFaces);
    await setupFaceEditorMockApiRoutes(context, createMockPeople(4), { requests: [] });
  });

  test('Escape closes person side panel with focus inside panel', async ({ page }) => {
    await page.goto(`/photos/${fixture.primaryAsset.id}`);
    await assetViewerUtils.waitForViewerLoad(page, fixture.primaryAsset);

    await openPersonSidePanel(page);

    const doneButton = page.getByText('Done');
    await doneButton.focus();

    await page.keyboard.press('Escape');

    await expect(page.getByText('Edit faces')).toBeHidden();
  });

  test('Escape closes person side panel with focus outside panel', async ({ page }) => {
    await page.goto(`/photos/${fixture.primaryAsset.id}`);
    await assetViewerUtils.waitForViewerLoad(page, fixture.primaryAsset);

    await openPersonSidePanel(page);

    await page.locator('#immich-asset-viewer').click({ position: { x: 10, y: 10 } });

    await page.keyboard.press('Escape');

    await expect(page.getByText('Edit faces')).toBeHidden();
  });

  test('Escape closes assign-face panel before person side panel', async ({ page }) => {
    await page.goto(`/photos/${fixture.primaryAsset.id}`);
    await assetViewerUtils.waitForViewerLoad(page, fixture.primaryAsset);

    await openPersonSidePanel(page);

    const editButtons = page.getByLabel('Select new face');
    await editButtons.first().click();

    const assignPanel = page.getByText('All people');
    await expect(assignPanel).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(assignPanel).toBeHidden();
    await expect(page.getByText('Edit faces')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByText('Edit faces')).toBeHidden();
  });

  test('Escape closes assign-face panel with focus outside panels', async ({ page }) => {
    await page.goto(`/photos/${fixture.primaryAsset.id}`);
    await assetViewerUtils.waitForViewerLoad(page, fixture.primaryAsset);

    await openPersonSidePanel(page);

    const editButtons = page.getByLabel('Select new face');
    await editButtons.first().click();

    const assignPanel = page.getByText('All people');
    await expect(assignPanel).toBeVisible();

    await page.locator('#immich-asset-viewer').click({ position: { x: 10, y: 10 } });

    await page.keyboard.press('Escape');

    await expect(assignPanel).toBeHidden();
    await expect(page.getByText('Edit faces')).toBeVisible();
  });
});
