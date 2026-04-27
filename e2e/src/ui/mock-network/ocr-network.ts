import { faker } from '@faker-js/faker';
import type { AssetOcrResponseDto } from '@immich/sdk';
import { BrowserContext } from '@playwright/test';

export type MockOcrBox = {
  text: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
  x4: number;
  y4: number;
};

export const createMockOcrData = (assetId: string, boxes: MockOcrBox[]): AssetOcrResponseDto[] => {
  return boxes.map((box) => ({
    id: faker.string.uuid(),
    assetId,
    x1: box.x1,
    y1: box.y1,
    x2: box.x2,
    y2: box.y2,
    x3: box.x3,
    y3: box.y3,
    x4: box.x4,
    y4: box.y4,
    boxScore: 0.95,
    textScore: 0.9,
    text: box.text,
  }));
};

export const setupOcrMockApiRoutes = async (
  context: BrowserContext,
  ocrDataByAssetId: Map<string, AssetOcrResponseDto[]>,
) => {
  await context.route('**/assets/*/ocr', async (route, request) => {
    if (request.method() !== 'GET') {
      return route.fallback();
    }
    const url = new URL(request.url());
    const segments = url.pathname.split('/');
    const assetIdIndex = segments.indexOf('assets') + 1;
    const assetId = segments[assetIdIndex];

    const ocrData = ocrDataByAssetId.get(assetId) ?? [];
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: ocrData,
    });
  });
};
