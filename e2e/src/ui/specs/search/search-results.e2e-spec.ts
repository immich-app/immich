import { faker } from '@faker-js/faker';
import { expect, type Request, test } from '@playwright/test';
import {
  Changes,
  createDefaultTimelineConfig,
  generateTimelineData,
  TimelineAssetConfig,
  TimelineData,
  toAssetResponseDto,
} from 'src/ui/generators/timeline';
import { setupBaseMockApiRoutes } from 'src/ui/mock-network/base-network.js';
import { setupTimelineMockApiRoutes, TimelineTestContext } from 'src/ui/mock-network/timeline-network.js';
import { thumbnailUtils } from '../timeline/utils';

const buildSearchUrl = (originalFileName: string) => {
  const searchQuery = encodeURIComponent(JSON.stringify({ originalFileName }));
  return `/search?query=${searchQuery}`;
};

const isOldSearchRequest = (request: Request) => request.postData()?.includes('old-search') ?? false;

test.describe.configure({ mode: 'parallel' });
test.describe('search results', () => {
  let adminUserId: string;
  let timelineRestData: TimelineData;
  const assets: TimelineAssetConfig[] = [];
  const testContext = new TimelineTestContext();
  const changes: Changes = {
    albumAdditions: [],
    assetDeletions: [],
    assetArchivals: [],
    assetFavorites: [],
  };

  test.beforeAll(async () => {
    test.fail(
      process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS !== '1',
      'This test requires env var: PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1',
    );
    adminUserId = faker.string.uuid();
    testContext.adminId = adminUserId;
    timelineRestData = generateTimelineData({ ...createDefaultTimelineConfig(), ownerId: adminUserId });
    for (const timeBucket of timelineRestData.buckets.values()) {
      assets.push(...timeBucket);
    }
  });

  test.beforeEach(async ({ context }) => {
    await setupBaseMockApiRoutes(context, adminUserId);
    await setupTimelineMockApiRoutes(context, timelineRestData, changes, testContext);
  });

  test('Results of a previous search that arrive late are ignored', async ({ context, page }) => {
    const [oldAsset, newAsset] = assets;
    const { promise: oldSearchReleased, resolve: releaseOldSearch } = Promise.withResolvers<void>();

    await context.route('**/api/search/metadata', async (route, request) => {
      if (request.method() !== 'POST') {
        return route.fallback();
      }
      const isOldSearch = isOldSearchRequest(request);
      if (isOldSearch) {
        await oldSearchReleased;
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          albums: { total: 0, count: 0, items: [], facets: [] },
          assets: {
            total: 1,
            count: 1,
            items: [toAssetResponseDto(isOldSearch ? oldAsset : newAsset)],
            facets: [],
            nextPage: null,
          },
        },
      });
    });

    const oldSearchRequest = page.waitForRequest(isOldSearchRequest);
    await page.goto(buildSearchUrl('old-search'));
    await oldSearchRequest;

    const searchBar = page.getByRole('combobox', { name: 'Search your photos' });
    await searchBar.fill('new-search');
    await searchBar.press('Enter');
    await expect(thumbnailUtils.withAssetId(page, newAsset.id)).toBeVisible();

    const oldSearchResponse = page.waitForResponse((response) => isOldSearchRequest(response.request()));
    releaseOldSearch();
    const response = await oldSearchResponse;
    await response.finished();
    await page.waitForTimeout(500);

    await expect(thumbnailUtils.withAssetId(page, newAsset.id)).toBeVisible();
    await expect(thumbnailUtils.withAssetId(page, oldAsset.id)).toHaveCount(0);
  });
});
