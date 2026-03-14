import { describe, expect, it } from 'vitest';
import type { TimelineManager } from '../timeline-manager.svelte';
import {
  IntersectionFlags,
  calculateViewerAssetIntersecting,
  isIntersecting,
  isRenderable,
  isVisible,
} from './intersection-support.svelte';

function createMockTimelineManager(windowTop: number, windowBottom: number, headerHeight: number = 0): TimelineManager {
  return {
    visibleWindow: { top: windowTop, bottom: windowBottom },
    headerHeight,
  } as TimelineManager;
}

describe('isIntersecting', () => {
  it('should return true when region top is inside window', () => {
    expect(isIntersecting(50, 150, 0, 100)).toBe(true);
  });

  it('should return true when region bottom is inside window', () => {
    expect(isIntersecting(-50, 50, 0, 100)).toBe(true);
  });

  it('should return true when region spans entire window', () => {
    expect(isIntersecting(-50, 150, 0, 100)).toBe(true);
  });

  it('should return true when region is fully inside window', () => {
    expect(isIntersecting(25, 75, 0, 100)).toBe(true);
  });

  it('should return false when region is entirely above window', () => {
    expect(isIntersecting(-100, -10, 0, 100)).toBe(false);
  });

  it('should return false when region is entirely below window', () => {
    expect(isIntersecting(110, 200, 0, 100)).toBe(false);
  });

  it('should return true when region bottom touches window top (inclusive)', () => {
    expect(isIntersecting(-50, 0, 0, 100)).toBe(true);
  });

  it('should return true when region top equals window top (inclusive)', () => {
    expect(isIntersecting(0, 50, 0, 100)).toBe(true);
  });

  it('should return false when region top equals window bottom (exclusive)', () => {
    expect(isIntersecting(100, 150, 0, 100)).toBe(false);
  });
});

describe('calculateViewerAssetIntersecting', () => {
  // viewport 0-1000, no header, default expand margins 500/500
  const manager = createMockTimelineManager(0, 1000);

  it('should return VISIBLE when asset is within viewport', () => {
    expect(calculateViewerAssetIntersecting(manager, 100, 50)).toBe(IntersectionFlags.VISIBLE);
  });

  it('should return VISIBLE when asset is at viewport top edge', () => {
    expect(calculateViewerAssetIntersecting(manager, 0, 50)).toBe(IntersectionFlags.VISIBLE);
  });

  it('should return VISIBLE when asset partially overlaps viewport bottom', () => {
    expect(calculateViewerAssetIntersecting(manager, 980, 50)).toBe(IntersectionFlags.VISIBLE);
  });

  it('should return NEARBY when asset is just above viewport within expand margin', () => {
    expect(calculateViewerAssetIntersecting(manager, -200, 50)).toBe(IntersectionFlags.NEARBY);
  });

  it('should return NEARBY when asset is just below viewport within expand margin', () => {
    expect(calculateViewerAssetIntersecting(manager, 1200, 50)).toBe(IntersectionFlags.NEARBY);
  });

  it('should return NONE when asset is far above viewport', () => {
    expect(calculateViewerAssetIntersecting(manager, -1000, 50)).toBe(IntersectionFlags.NONE);
  });

  it('should return NONE when asset is far below viewport', () => {
    expect(calculateViewerAssetIntersecting(manager, 2000, 50)).toBe(IntersectionFlags.NONE);
  });

  it('should account for header height in viewport bounds', () => {
    const managerWithHeader = createMockTimelineManager(100, 500, 50);
    // viewport effectively becomes (100-50)=50 to (500+50)=550
    // asset at 40-90 overlaps the effective viewport
    expect(calculateViewerAssetIntersecting(managerWithHeader, 40, 50)).toBe(IntersectionFlags.VISIBLE);
  });

  it('should return NEARBY not VISIBLE for asset outside viewport but within header-adjusted expand', () => {
    const managerWithHeader = createMockTimelineManager(100, 500, 50);
    // effective viewport: 50-550, expand: 500 each way -> -450 to 1050
    // asset at -400 to -350 is outside viewport but within expand
    expect(calculateViewerAssetIntersecting(managerWithHeader, -400, 50)).toBe(IntersectionFlags.NEARBY);
  });
});

describe('Intersection flags', () => {
  it('RENDERABLE should be NEARBY | VISIBLE', () => {
    expect(IntersectionFlags.RENDERABLE).toBe(IntersectionFlags.NEARBY | IntersectionFlags.VISIBLE);
  });
});

describe('isVisible', () => {
  it('should return true for VISIBLE', () => {
    expect(isVisible(IntersectionFlags.VISIBLE)).toBe(true);
  });

  it('should return true for RENDERABLE', () => {
    expect(isVisible(IntersectionFlags.RENDERABLE)).toBe(true);
  });

  it('should return false for NEARBY', () => {
    expect(isVisible(IntersectionFlags.NEARBY)).toBe(false);
  });

  it('should return false for NONE', () => {
    expect(isVisible(IntersectionFlags.NONE)).toBe(false);
  });
});

describe('isRenderable', () => {
  it('should return true for VISIBLE', () => {
    expect(isRenderable(IntersectionFlags.VISIBLE)).toBe(true);
  });

  it('should return true for NEARBY', () => {
    expect(isRenderable(IntersectionFlags.NEARBY)).toBe(true);
  });

  it('should return true for RENDERABLE', () => {
    expect(isRenderable(IntersectionFlags.RENDERABLE)).toBe(true);
  });

  it('should return false for NONE', () => {
    expect(isRenderable(IntersectionFlags.NONE)).toBe(false);
  });
});
