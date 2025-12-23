import { ocrManager, type OcrBoundingBox } from '$lib/stores/ocr.svelte';
import { getAssetOcr } from '@immich/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the SDK
vi.mock('@immich/sdk', () => ({
  getAssetOcr: vi.fn(),
}));

const createMockOcrData = (overrides?: Partial<OcrBoundingBox>): OcrBoundingBox[] => [
  {
    id: '1',
    assetId: 'asset-123',
    x1: 0,
    y1: 0,
    x2: 100,
    y2: 0,
    x3: 100,
    y3: 50,
    x4: 0,
    y4: 50,
    boxScore: 0.95,
    textScore: 0.98,
    text: 'Hello World',
    ...overrides,
  },
];

describe('OcrManager', () => {
  beforeEach(() => {
    // Reset the singleton state before each test
    ocrManager.clear();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with empty data', () => {
      expect(ocrManager.data).toEqual([]);
    });

    it('should initialize with showOverlay as false', () => {
      expect(ocrManager.showOverlay).toBe(false);
    });

    it('should initialize with hasOcrData as false', () => {
      expect(ocrManager.hasOcrData).toBe(false);
    });
  });

  describe('getAssetOcr', () => {
    it('should load OCR data for an asset', async () => {
      const mockData = createMockOcrData();
      vi.mocked(getAssetOcr).mockResolvedValue(mockData);

      await ocrManager.getAssetOcr('asset-123');

      expect(getAssetOcr).toHaveBeenCalledWith({ id: 'asset-123' });
      expect(ocrManager.data).toEqual(mockData);
      expect(ocrManager.hasOcrData).toBe(true);
    });

    it('should handle empty OCR data', async () => {
      vi.mocked(getAssetOcr).mockResolvedValue([]);

      await ocrManager.getAssetOcr('asset-456');

      expect(ocrManager.data).toEqual([]);
      expect(ocrManager.hasOcrData).toBe(false);
    });

    it('should reset the loader when previously cleared', async () => {
      const mockData = createMockOcrData();
      vi.mocked(getAssetOcr).mockResolvedValue(mockData);

      // First clear
      ocrManager.clear();
      expect(ocrManager.data).toEqual([]);

      // Then load new data
      await ocrManager.getAssetOcr('asset-789');

      expect(ocrManager.data).toEqual(mockData);
      expect(ocrManager.hasOcrData).toBe(true);
    });

    it('should handle concurrent requests safely', async () => {
      const firstData = createMockOcrData({ id: '1', text: 'First' });
      const secondData = createMockOcrData({ id: '2', text: 'Second' });

      vi.mocked(getAssetOcr)
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              setTimeout(() => resolve(firstData), 100);
            }),
        )
        .mockResolvedValueOnce(secondData);

      // Start first request
      const promise1 = ocrManager.getAssetOcr('asset-1');
      // Start second request immediately (should wait for first to complete)
      const promise2 = ocrManager.getAssetOcr('asset-2');

      await Promise.all([promise1, promise2]);

      // CancellableTask waits for first request, so second request is ignored
      // The data should be from the first request that completed
      expect(ocrManager.data).toEqual(firstData);
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Network error');
      vi.mocked(getAssetOcr).mockRejectedValue(error);

      // The error should be handled by CancellableTask
      await expect(ocrManager.getAssetOcr('asset-error')).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear OCR data', async () => {
      const mockData = createMockOcrData({ text: 'Test' });
      vi.mocked(getAssetOcr).mockResolvedValue(mockData);
      await ocrManager.getAssetOcr('asset-123');

      ocrManager.clear();

      expect(ocrManager.data).toEqual([]);
      expect(ocrManager.hasOcrData).toBe(false);
    });

    it('should reset showOverlay to false', () => {
      ocrManager.showOverlay = true;

      ocrManager.clear();

      expect(ocrManager.showOverlay).toBe(false);
    });

    it('should mark as cleared for next load', async () => {
      const mockData = createMockOcrData({ text: 'Test' });
      vi.mocked(getAssetOcr).mockResolvedValue(mockData);

      ocrManager.clear();
      await ocrManager.getAssetOcr('asset-123');

      // Should successfully load after clear
      expect(ocrManager.data).toEqual(mockData);
    });
  });

  describe('toggleOcrBoundingBox', () => {
    it('should toggle showOverlay from false to true', () => {
      expect(ocrManager.showOverlay).toBe(false);

      ocrManager.toggleOcrBoundingBox();

      expect(ocrManager.showOverlay).toBe(true);
    });

    it('should toggle showOverlay from true to false', () => {
      ocrManager.showOverlay = true;

      ocrManager.toggleOcrBoundingBox();

      expect(ocrManager.showOverlay).toBe(false);
    });

    it('should toggle multiple times', () => {
      ocrManager.toggleOcrBoundingBox();
      expect(ocrManager.showOverlay).toBe(true);

      ocrManager.toggleOcrBoundingBox();
      expect(ocrManager.showOverlay).toBe(false);

      ocrManager.toggleOcrBoundingBox();
      expect(ocrManager.showOverlay).toBe(true);
    });
  });

  describe('hasOcrData derived state', () => {
    it('should be false when data is empty', () => {
      expect(ocrManager.hasOcrData).toBe(false);
    });

    it('should be true when data is present', async () => {
      const mockData = createMockOcrData({ text: 'Test' });
      vi.mocked(getAssetOcr).mockResolvedValue(mockData);
      await ocrManager.getAssetOcr('asset-123');

      expect(ocrManager.hasOcrData).toBe(true);
    });

    it('should update when data is cleared', async () => {
      const mockData = createMockOcrData({ text: 'Test' });
      vi.mocked(getAssetOcr).mockResolvedValue(mockData);
      await ocrManager.getAssetOcr('asset-123');
      expect(ocrManager.hasOcrData).toBe(true);

      ocrManager.clear();
      expect(ocrManager.hasOcrData).toBe(false);
    });
  });

  describe('data immutability', () => {
    it('should return the same reference when data does not change', () => {
      const firstReference = ocrManager.data;
      const secondReference = ocrManager.data;

      expect(firstReference).toBe(secondReference);
    });

    it('should return a new reference when data changes', async () => {
      const firstReference = ocrManager.data;
      const mockData = createMockOcrData({ text: 'Test' });

      vi.mocked(getAssetOcr).mockResolvedValue(mockData);
      await ocrManager.getAssetOcr('asset-123');

      const secondReference = ocrManager.data;

      expect(firstReference).not.toBe(secondReference);
    });
  });
});
