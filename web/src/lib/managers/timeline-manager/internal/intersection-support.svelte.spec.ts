import { describe, expect, it } from 'vitest';
import type { TimelineManager } from '../timeline-manager.svelte';
import { Intersection, calculateViewerAssetIntersecting, isIntersecting } from './intersection-support.svelte';

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

  it('should return ACTUAL when asset is within viewport', () => {
    expect(calculateViewerAssetIntersecting(manager, 100, 50)).toBe(Intersection.ACTUAL);
  });

  it('should return ACTUAL when asset is at viewport top edge', () => {
    expect(calculateViewerAssetIntersecting(manager, 0, 50)).toBe(Intersection.ACTUAL);
  });

  it('should return ACTUAL when asset partially overlaps viewport bottom', () => {
    expect(calculateViewerAssetIntersecting(manager, 980, 50)).toBe(Intersection.ACTUAL);
  });

  it('should return PRE when asset is just above viewport within expand margin', () => {
    expect(calculateViewerAssetIntersecting(manager, -200, 50)).toBe(Intersection.PRE);
  });

  it('should return PRE when asset is just below viewport within expand margin', () => {
    expect(calculateViewerAssetIntersecting(manager, 1200, 50)).toBe(Intersection.PRE);
  });

  it('should return NONE when asset is far above viewport', () => {
    expect(calculateViewerAssetIntersecting(manager, -1000, 50)).toBe(Intersection.NONE);
  });

  it('should return NONE when asset is far below viewport', () => {
    expect(calculateViewerAssetIntersecting(manager, 2000, 50)).toBe(Intersection.NONE);
  });

  it('should account for header height in viewport bounds', () => {
    const managerWithHeader = createMockTimelineManager(100, 500, 50);
    // viewport effectively becomes (100-50)=50 to (500+50)=550
    // asset at 40-90 overlaps the effective viewport
    expect(calculateViewerAssetIntersecting(managerWithHeader, 40, 50)).toBe(Intersection.ACTUAL);
  });

  it('should return PRE not ACTUAL for asset outside viewport but within header-adjusted expand', () => {
    const managerWithHeader = createMockTimelineManager(100, 500, 50);
    // effective viewport: 50-550, expand: 500 each way -> -450 to 1050
    // asset at -400 to -350 is outside viewport but within expand
    expect(calculateViewerAssetIntersecting(managerWithHeader, -400, 50)).toBe(Intersection.PRE);
  });
});
