import { AssetResponseDto } from '@immich/sdk';
import { BrowserContext, Page, Request, Route } from '@playwright/test';
import { basename } from 'node:path';
import {
  Changes,
  getAlbum,
  getAsset,
  getTimeBucket,
  getTimeBuckets,
  randomPreview,
  randomThumbnail,
  TimelineData,
} from 'src/generators/timeline';
import { sleep } from 'src/web/specs/timeline/utils';

export class TimelineTestContext {
  slowBucket = false;
  adminId = '';
}

export const setupTimelineMockApiRoutes = async (
  context: BrowserContext,
  timelineRestData: TimelineData,
  changes: Changes,
  testContext: TimelineTestContext,
) => {
  await context.route('**/api/timeline**', async (route, request) => {
    const url = new URL(request.url());
    const pathname = url.pathname;
    if (pathname === '/api/timeline/buckets') {
      const albumId = url.searchParams.get('albumId') || undefined;
      const isTrashed = url.searchParams.get('isTrashed') ? url.searchParams.get('isTrashed') === 'true' : undefined;
      const isFavorite = url.searchParams.get('isFavorite') ? url.searchParams.get('isFavorite') === 'true' : undefined;
      const isArchived = url.searchParams.get('visibility')
        ? url.searchParams.get('visibility') === 'archive'
        : undefined;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: getTimeBuckets(timelineRestData, isTrashed, isArchived, isFavorite, albumId, changes),
      });
    } else if (pathname === '/api/timeline/bucket') {
      const timeBucket = url.searchParams.get('timeBucket');
      if (!timeBucket) {
        return route.continue();
      }
      const isTrashed = url.searchParams.get('isTrashed') ? url.searchParams.get('isTrashed') === 'true' : undefined;
      const isArchived = url.searchParams.get('visibility')
        ? url.searchParams.get('visibility') === 'archive'
        : undefined;
      const isFavorite = url.searchParams.get('isFavorite') ? url.searchParams.get('isFavorite') === 'true' : undefined;
      const albumId = url.searchParams.get('albumId') || undefined;
      const assets = getTimeBucket(timelineRestData, timeBucket, isTrashed, isArchived, isFavorite, albumId, changes);
      if (testContext.slowBucket) {
        await sleep(5000);
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: assets,
      });
    }
    return route.continue();
  });

  await context.route('**/api/assets/*', async (route, request) => {
    if (request.method() === 'GET') {
      const url = new URL(request.url());
      const pathname = url.pathname;
      const assetId = basename(pathname);
      let asset = getAsset(timelineRestData, assetId);
      if (changes.assetDeletions.includes(asset!.id)) {
        asset = {
          ...asset,
          isTrashed: true,
        } as AssetResponseDto;
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: asset,
      });
    }
    await route.fallback();
  });

  await context.route('**/api/assets', async (route, request) => {
    if (request.method() === 'DELETE') {
      return route.fulfill({
        status: 204,
      });
    }
    await route.fallback();
  });

  await context.route('**/api/assets/*/ocr', async (route) => {
    return route.fulfill({ status: 200, contentType: 'application/json', json: [] });
  });

  await context.route('**/api/assets/*/thumbnail?size=*', async (route, request) => {
    const pattern = /\/api\/assets\/(?<assetId>[^/]+)\/thumbnail\?size=(?<size>preview|thumbnail)/;
    const match = request.url().match(pattern);
    if (!match?.groups) {
      throw new Error(`Invalid URL for thumbnail endpoint: ${request.url()}`);
    }

    if (match.groups.size === 'preview') {
      if (!route.request().serviceWorker()) {
        return route.continue();
      }
      const asset = getAsset(timelineRestData, match.groups.assetId);
      return route.fulfill({
        status: 200,
        headers: { 'content-type': 'image/jpeg', ETag: 'abc123', 'Cache-Control': 'public, max-age=3600' },
        body: await randomPreview(
          match.groups.assetId,
          (asset?.exifInfo?.exifImageWidth ?? 0) / (asset?.exifInfo?.exifImageHeight ?? 1),
        ),
      });
    }
    if (match.groups.size === 'thumbnail') {
      if (!route.request().serviceWorker()) {
        return route.continue();
      }
      const asset = getAsset(timelineRestData, match.groups.assetId);
      return route.fulfill({
        status: 200,
        headers: { 'content-type': 'image/jpeg' },
        body: await randomThumbnail(
          match.groups.assetId,
          (asset?.exifInfo?.exifImageWidth ?? 0) / (asset?.exifInfo?.exifImageHeight ?? 1),
        ),
      });
    }
    return route.continue();
  });

  await context.route('**/api/albums/**', async (route, request) => {
    const albumsMatch = request.url().match(/\/api\/albums\/(?<albumId>[^/?]+)/);
    if (albumsMatch) {
      const album = getAlbum(timelineRestData, testContext.adminId, albumsMatch.groups?.albumId, changes);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: album,
      });
    }
    return route.fallback();
  });

  await context.route('**/api/albums**', async (route, request) => {
    const allAlbums = request.url().match(/\/api\/albums\?assetId=(?<assetId>[^&]+)/);
    if (allAlbums) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [],
      });
    }
    return route.fallback();
  });
};

export const pageRoutePromise = async (
  page: Page,
  route: string,
  callback: (route: Route, request: Request) => Promise<void>,
) => {
  let resolveRequest: ((value: unknown | PromiseLike<unknown>) => void) | undefined;
  const deleteRequest = new Promise((resolve) => {
    resolveRequest = resolve;
  });
  await page.route(route, async (route, request) => {
    await callback(route, request);
    const requestJson = request.postDataJSON();
    resolveRequest?.(requestJson);
  });
  return deleteRequest;
};
