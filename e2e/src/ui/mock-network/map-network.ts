import type { MapMarkerResponseDto } from '@immich/sdk';
import { BrowserContext } from '@playwright/test';
import { TimelineData } from 'src/ui/generators/timeline';

export const setupMapMockApiRoutes = async (context: BrowserContext, timelineData: TimelineData) => {
  await context.route('**/api/map/markers', async (route) => {
    const markers: MapMarkerResponseDto[] = [];

    for (const bucket of timelineData.buckets.values()) {
      for (const asset of bucket) {
        // Only include assets with GPS coordinates
        if (asset.latitude !== null && asset.longitude !== null) {
          markers.push({
            id: asset.id,
            lat: asset.latitude,
            lon: asset.longitude,
            city: asset.city,
            state: null,
            country: asset.country,
          });
        }
      }
    }
    markers.sort((a, b) => a.id.localeCompare(b.id));

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: markers,
    });
  });
};
