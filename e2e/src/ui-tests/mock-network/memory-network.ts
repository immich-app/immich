import type { MemoryResponseDto } from '@immich/sdk';
import { BrowserContext } from '@playwright/test';

export type MemoryChanges = {
  memoryDeletions: string[];
  assetRemovals: Map<string, string[]>;
};

export const setupMemoryMockApiRoutes = async (
  context: BrowserContext,
  memories: MemoryResponseDto[],
  changes: MemoryChanges,
) => {
  await context.route('**/api/memories*', async (route, request) => {
    const url = new URL(request.url());
    const pathname = url.pathname;

    if (pathname === '/api/memories' && request.method() === 'GET') {
      const activeMemories = memories
        .filter((memory) => !changes.memoryDeletions.includes(memory.id))
        .map((memory) => {
          const removedAssets = changes.assetRemovals.get(memory.id) ?? [];
          return {
            ...memory,
            assets: memory.assets.filter((asset) => !removedAssets.includes(asset.id)),
          };
        })
        .filter((memory) => memory.assets.length > 0);

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: activeMemories,
      });
    }

    const memoryMatch = pathname.match(/\/api\/memories\/([^/]+)$/);
    if (memoryMatch && request.method() === 'GET') {
      const memoryId = memoryMatch[1];
      const memory = memories.find((m) => m.id === memoryId);

      if (!memory || changes.memoryDeletions.includes(memoryId)) {
        return route.fulfill({ status: 404 });
      }

      const removedAssets = changes.assetRemovals.get(memoryId) ?? [];
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          ...memory,
          assets: memory.assets.filter((asset) => !removedAssets.includes(asset.id)),
        },
      });
    }

    if (/\/api\/memories\/([^/]+)$/.test(pathname) && request.method() === 'DELETE') {
      const memoryId = pathname.split('/').pop()!;
      changes.memoryDeletions.push(memoryId);
      return route.fulfill({ status: 204 });
    }

    await route.fallback();
  });
};
