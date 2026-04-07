/**
 * Playwright script to capture screenshots for visual diff scenarios.
 *
 * Usage:
 *   npx playwright test --config e2e/playwright.screenshot.config.ts
 *
 * Environment variables:
 *   SCREENSHOT_SCENARIOS - JSON array of scenario names to run (from page-map.ts)
 *                          If not set, runs all scenarios.
 *   SCREENSHOT_OUTPUT_DIR - Directory to save screenshots to. Defaults to e2e/screenshots-output.
 */

import { faker } from '@faker-js/faker';
import type { MemoryResponseDto } from '@immich/sdk';
import { test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateMemoriesFromTimeline } from 'src/ui/generators/memory';
import {
  createDefaultTimelineConfig,
  generateTimelineData,
  type TimelineAssetConfig,
  type TimelineData,
} from 'src/ui/generators/timeline';
import { setupBaseMockApiRoutes } from 'src/ui/mock-network/base-network';
import { setupMemoryMockApiRoutes } from 'src/ui/mock-network/memory-network';
import { setupTimelineMockApiRoutes, TimelineTestContext } from 'src/ui/mock-network/timeline-network';
import { PAGE_SCENARIOS, type ScenarioDefinition } from './page-map';

const OUTPUT_DIR = process.env.SCREENSHOT_OUTPUT_DIR || resolve(import.meta.dirname, '../../../screenshots-output');
const SCENARIO_FILTER: string[] | null = process.env.SCREENSHOT_SCENARIOS
  ? JSON.parse(process.env.SCREENSHOT_SCENARIOS)
  : null;

// Collect scenarios to run
const allScenarios: ScenarioDefinition[] = [];
for (const defs of Object.values(PAGE_SCENARIOS)) {
  for (const def of defs) {
    if (!SCENARIO_FILTER || SCENARIO_FILTER.includes(def.name)) {
      allScenarios.push(def);
    }
  }
}

// Use a fixed seed so screenshots are deterministic across runs
faker.seed(42);

let adminUserId: string;
let timelineData: TimelineData;
let timelineAssets: TimelineAssetConfig[];
let memories: MemoryResponseDto[];

test.beforeAll(async () => {
  adminUserId = faker.string.uuid();
  timelineData = generateTimelineData({ ...createDefaultTimelineConfig(), ownerId: adminUserId });

  timelineAssets = [];
  for (const timeBucket of timelineData.buckets.values()) {
    timelineAssets.push(...timeBucket);
  }

  memories = generateMemoriesFromTimeline(
    timelineAssets,
    adminUserId,
    [
      { year: 2024, assetCount: 3 },
      { year: 2023, assetCount: 2 },
    ],
    42,
  );

  mkdirSync(OUTPUT_DIR, { recursive: true });
});

for (const scenario of allScenarios) {
  test(`Screenshot: ${scenario.name}`, async ({ context, page }) => {
    // Set up mocks based on scenario requirements
    if (scenario.mocks.includes('base')) {
      await setupBaseMockApiRoutes(context, adminUserId);
    }

    if (scenario.mocks.includes('timeline')) {
      const testContext = new TimelineTestContext();
      testContext.adminId = adminUserId;
      await setupTimelineMockApiRoutes(
        context,
        timelineData,
        {
          albumAdditions: [],
          assetDeletions: [],
          assetArchivals: [],
          assetFavorites: [],
        },
        testContext,
      );
    }

    if (scenario.mocks.includes('memory')) {
      await setupMemoryMockApiRoutes(context, memories, {
        memoryDeletions: [],
        assetRemovals: new Map(),
      });
    }

    // Navigate to the page. Use networkidle so SvelteKit hydrates and API
    // calls complete, but fall back to domcontentloaded if it times out
    // (e.g. a persistent connection the catch-all mock didn't cover).
    try {
      await page.goto(scenario.url, { waitUntil: 'networkidle', timeout: 15_000 });
    } catch {
      console.warn(`networkidle timed out for ${scenario.name}, falling back to current state`);
      // Page has already navigated, just continue with what we have
    }

    // Wait for specific selector if specified
    if (scenario.waitForSelector) {
      try {
        await page.waitForSelector(scenario.waitForSelector, { timeout: 15_000 });
      } catch {
        console.warn(`Selector ${scenario.waitForSelector} not found for ${scenario.name}, continuing...`);
      }
    }

    // Wait for loading spinners to disappear
    await page
      .waitForFunction(() => document.querySelectorAll('[data-testid="loading-spinner"]').length === 0, {
        timeout: 10_000,
      })
      .catch(() => {});

    // Wait for animations/transitions to settle
    await page.waitForTimeout(scenario.settleTime ?? 500);

    // Take the screenshot
    await page.screenshot({
      path: resolve(OUTPUT_DIR, `${scenario.name}.png`),
      fullPage: false,
    });
  });
}
