import type { Feature, Point } from 'geojson';
import type { GeoJSONSource, Map } from 'maplibre-gl';
import type { Mock } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { autoZoomCluster } from '../utils';

/**
 * Unit tests for the autoZoomCluster function
 */
describe('autoZoomCluster', () => {
  let mockMap: Partial<Map>;
  let mockMapSource: Partial<GeoJSONSource>;
  let onSelect: Mock;
  let onClusterSelect: Mock;

  const createMockLeaf = (id: string, lon: number, lat: number): Feature<Point> => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lon, lat] },
    properties: { id },
  });

  beforeEach(() => {
    onSelect = vi.fn();
    onClusterSelect = vi.fn();
    mockMap = {
      fitBounds: vi.fn(),
      flyTo: vi.fn(),
      getZoom: vi.fn().mockReturnValue(10),
    };
    mockMapSource = {
      getClusterLeaves: vi.fn(),
      getClusterExpansionZoom: vi.fn(),
    };
  });

  describe('Empty clusters', () => {
    it('should handle empty cluster leaves gracefully', async () => {
      (mockMapSource.getClusterLeaves as Mock).mockResolvedValue([]);

      await autoZoomCluster({
        map: mockMap as Map,
        mapSource: mockMapSource as GeoJSONSource,
        clusterId: 123,
        onSelect,
        onClusterSelect,
      });

      expect(mockMap.fitBounds).not.toHaveBeenCalled();
      expect(mockMap.flyTo).not.toHaveBeenCalled();
      expect(onSelect).not.toHaveBeenCalled();
      expect(onClusterSelect).not.toHaveBeenCalled();
    });
  });

  describe('Multiple locations (fitBounds)', () => {
    it('should use fitBounds for cluster with 2 distinct locations', async () => {
      const leaves = [createMockLeaf('asset1', 10, 20), createMockLeaf('asset2', 30, 40)];

      (mockMapSource.getClusterLeaves as Mock).mockResolvedValue(leaves);

      await autoZoomCluster({
        map: mockMap as Map,
        mapSource: mockMapSource as GeoJSONSource,
        clusterId: 123,
        onSelect,
      });

      expect(mockMap.fitBounds).toHaveBeenCalledWith(
        [
          [10, 20],
          [30, 40],
        ],
        { padding: 100, speed: 1.5, maxZoom: 17 },
      );
      expect(mockMap.flyTo).not.toHaveBeenCalled();
      expect(onSelect).toHaveBeenCalledWith(['asset1', 'asset2']);
    });

    it('should calculate correct bounding box with 3+ assets', async () => {
      const leaves = [createMockLeaf('a1', 10, 20), createMockLeaf('a2', 5, 15), createMockLeaf('a3', 25, 35)];

      (mockMapSource.getClusterLeaves as Mock).mockResolvedValue(leaves);

      await autoZoomCluster({
        map: mockMap as Map,
        mapSource: mockMapSource as GeoJSONSource,
        clusterId: 789,
        onSelect,
        onClusterSelect,
      });

      expect(mockMap.fitBounds).toHaveBeenCalledWith(
        [
          [5, 15],
          [25, 35],
        ],
        { padding: 100, speed: 1.5, maxZoom: 17 },
      );
      expect(onClusterSelect).toHaveBeenCalledWith(['a1', 'a2', 'a3'], {
        west: 5,
        south: 15,
        east: 25,
        north: 35,
      });
    });

    it('should handle negative coordinates correctly in bounding box', async () => {
      const leaves = [createMockLeaf('a1', -10, -20), createMockLeaf('a2', 10, 20)];

      (mockMapSource.getClusterLeaves as Mock).mockResolvedValue(leaves);

      await autoZoomCluster({
        map: mockMap as Map,
        mapSource: mockMapSource as GeoJSONSource,
        clusterId: 999,
        onSelect,
        onClusterSelect,
      });

      expect(mockMap.fitBounds).toHaveBeenCalledWith(
        [
          [-10, -20],
          [10, 20],
        ],
        { padding: 100, speed: 1.5, maxZoom: 17 },
      );
      expect(onClusterSelect).toHaveBeenCalledWith(['a1', 'a2'], {
        west: -10,
        south: -20,
        east: 10,
        north: 20,
      });
    });
  });

  describe('Single location (flyTo)', () => {
    it('should use flyTo for single asset', async () => {
      const leaves = [createMockLeaf('asset1', 50, 60)];

      (mockMapSource.getClusterLeaves as Mock).mockResolvedValue(leaves);
      (mockMapSource.getClusterExpansionZoom as Mock).mockResolvedValue(14);

      await autoZoomCluster({
        map: mockMap as Map,
        mapSource: mockMapSource as GeoJSONSource,
        clusterId: 456,
        onSelect,
      });

      expect(mockMap.flyTo).toHaveBeenCalledWith({
        center: [50, 60],
        zoom: 14,
        speed: 1.5,
      });
      expect(mockMap.fitBounds).not.toHaveBeenCalled();
      expect(onSelect).toHaveBeenCalledWith(['asset1']);
    });

    it('should use flyTo for multiple assets at exact same location', async () => {
      const leaves = [createMockLeaf('a1', 50, 60), createMockLeaf('a2', 50, 60), createMockLeaf('a3', 50, 60)];

      (mockMapSource.getClusterLeaves as Mock).mockResolvedValue(leaves);
      (mockMapSource.getClusterExpansionZoom as Mock).mockResolvedValue(15);

      await autoZoomCluster({
        map: mockMap as Map,
        mapSource: mockMapSource as GeoJSONSource,
        clusterId: 456,
        onSelect,
      });

      expect(mockMap.flyTo).toHaveBeenCalledWith({
        center: [50, 60],
        zoom: 15,
        speed: 1.5,
      });
      expect(mockMap.fitBounds).not.toHaveBeenCalled();
      expect(onSelect).toHaveBeenCalledWith(['a1', 'a2', 'a3']);
    });
  });

  describe('Fallback zoom behavior', () => {
    it('should fallback to map.getZoom() + 2 when expansionZoom is undefined', async () => {
      const leaves = [createMockLeaf('asset1', 50, 60)];

      (mockMapSource.getClusterLeaves as Mock).mockResolvedValue(leaves);
      (mockMapSource.getClusterExpansionZoom as Mock).mockResolvedValue(undefined);

      await autoZoomCluster({
        map: mockMap as Map,
        mapSource: mockMapSource as GeoJSONSource,
        clusterId: 456,
        onSelect,
      });

      expect(mockMap.flyTo).toHaveBeenCalledWith({
        center: [50, 60],
        zoom: 12,
        speed: 1.5,
      });
      expect(onSelect).toHaveBeenCalledWith(['asset1']);
    });

    it('should fallback to map.getZoom() + 2 when expansionZoom throws error', async () => {
      const leaves = [createMockLeaf('asset1', 50, 60)];

      (mockMapSource.getClusterLeaves as Mock).mockResolvedValue(leaves);
      (mockMapSource.getClusterExpansionZoom as Mock).mockRejectedValue(new Error('Expansion zoom lookup failed'));

      await autoZoomCluster({
        map: mockMap as Map,
        mapSource: mockMapSource as GeoJSONSource,
        clusterId: 456,
        onSelect,
      });

      expect(mockMap.flyTo).toHaveBeenCalledWith({
        center: [50, 60],
        zoom: 12,
        speed: 1.5,
      });
      expect(onSelect).toHaveBeenCalledWith(['asset1']);
    });
  });

  describe('Callback routing', () => {
    it('should call onClusterSelect with bbox when provided', async () => {
      const leaves = [createMockLeaf('a1', 10, 20), createMockLeaf('a2', 30, 40)];

      (mockMapSource.getClusterLeaves as Mock).mockResolvedValue(leaves);

      await autoZoomCluster({
        map: mockMap as Map,
        mapSource: mockMapSource as GeoJSONSource,
        clusterId: 123,
        onSelect,
        onClusterSelect,
      });

      expect(onClusterSelect).toHaveBeenCalledWith(['a1', 'a2'], {
        west: 10,
        south: 20,
        east: 30,
        north: 40,
      });
      // onClusterSelect should be called, not onSelect
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('should call onSelect as fallback when onClusterSelect is not provided', async () => {
      const leaves = [createMockLeaf('a1', 10, 20), createMockLeaf('a2', 30, 40)];

      (mockMapSource.getClusterLeaves as Mock).mockResolvedValue(leaves);

      await autoZoomCluster({
        map: mockMap as Map,
        mapSource: mockMapSource as GeoJSONSource,
        clusterId: 123,
        onSelect,
        onClusterSelect: undefined,
      });

      expect(onSelect).toHaveBeenCalledWith(['a1', 'a2']);
      expect(onClusterSelect).not.toHaveBeenCalled();
    });
  });

  describe('Asset ID extraction', () => {
    it('should correctly extract asset IDs from cluster leaves', async () => {
      const leaves = [
        createMockLeaf('uuid-1-2-3', 10, 20),
        createMockLeaf('uuid-4-5-6', 30, 40),
        createMockLeaf('uuid-7-8-9', 50, 60),
      ];

      (mockMapSource.getClusterLeaves as Mock).mockResolvedValue(leaves);

      await autoZoomCluster({
        map: mockMap as Map,
        mapSource: mockMapSource as GeoJSONSource,
        clusterId: 123,
        onSelect,
      });

      expect(onSelect).toHaveBeenCalledWith(['uuid-1-2-3', 'uuid-4-5-6', 'uuid-7-8-9']);
    });

    it('should handle leaves without id property gracefully', async () => {
      const leaves: Feature<Point>[] = [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [10, 20] },
          properties: {},
        } as unknown as Feature<Point>,
      ];

      (mockMapSource.getClusterLeaves as Mock).mockResolvedValue(leaves);

      await autoZoomCluster({
        map: mockMap as Map,
        mapSource: mockMapSource as GeoJSONSource,
        clusterId: 123,
        onSelect,
      });

      // Should call with undefined id
      expect(onSelect).toHaveBeenCalledWith([undefined]);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle large cluster with many assets', async () => {
      const leaves = Array.from({ length: 100 }, (_, i) =>
        createMockLeaf(`asset-${i}`, Math.random() * 180 - 90, Math.random() * 360 - 180),
      );

      (mockMapSource.getClusterLeaves as Mock).mockResolvedValue(leaves);

      await autoZoomCluster({
        map: mockMap as Map,
        mapSource: mockMapSource as GeoJSONSource,
        clusterId: 123,
        onSelect,
        onClusterSelect,
      });

      expect(mockMap.fitBounds).toHaveBeenCalled();
      expect(onClusterSelect).toHaveBeenCalled();
      const [ids, bbox] = onClusterSelect.mock.calls[0];
      expect(ids).toHaveLength(100);
      expect(bbox).toHaveProperty('west');
      expect(bbox).toHaveProperty('south');
      expect(bbox).toHaveProperty('east');
      expect(bbox).toHaveProperty('north');
    });

    it('should retrieve up to 10,000 cluster leaves', async () => {
      const leaves = [createMockLeaf('asset1', 10, 20)];
      (mockMapSource.getClusterLeaves as Mock).mockResolvedValue(leaves);

      await autoZoomCluster({
        map: mockMap as Map,
        mapSource: mockMapSource as GeoJSONSource,
        clusterId: 123,
        onSelect,
      });

      // Verify getClusterLeaves was called with limit 10000
      expect(mockMapSource.getClusterLeaves).toHaveBeenCalledWith(123, 10_000, 0);
    });
  });
});
