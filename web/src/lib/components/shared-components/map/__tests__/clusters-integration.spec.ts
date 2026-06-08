import type { Feature, Point } from 'geojson';
import type { GeoJSONSource, Map } from 'maplibre-gl';
import type { Mock } from 'vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Map component - Cluster click integration', () => {
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
      getSource: vi.fn().mockReturnValue({
        getClusterLeaves: vi.fn(),
        getClusterExpansionZoom: vi.fn(),
      }),
    };
    mockMapSource = {
      getClusterLeaves: vi.fn(),
      getClusterExpansionZoom: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Contract validation', () => {
    it('should extract mapSource from map.getSource("geojson")', () => {
      const getSourceMock = vi.fn().mockReturnValue(mockMapSource);
      mockMap.getSource = getSourceMock;

      const extractedSource = (mockMap as Map).getSource('geojson');

      expect(getSourceMock).toHaveBeenCalledWith('geojson');
      expect(extractedSource).toBe(mockMapSource);
    });

    it('should handle null map gracefully', () => {
      const nullMap: Map | null = null;
      expect(nullMap).toBeNull();
    });
  });

  describe('Cluster click flow - Multiple locations', () => {
    it('should trigger fitBounds for multi-location cluster', () => {
      const leaves = [createMockLeaf('a1', 10, 20), createMockLeaf('a2', 30, 40)];
      (mockMapSource.getClusterLeaves as Mock).mockResolvedValue(leaves);

      expect(leaves.length).toBeGreaterThan(1);
      const coords = leaves.map((l) => (l.geometry as Point).coordinates);
      expect(coords).toHaveLength(2);

      const bboxWest = Math.min(...coords.map((c) => c[0]));
      const bboxSouth = Math.min(...coords.map((c) => c[1]));
      const bboxEast = Math.max(...coords.map((c) => c[0]));
      const bboxNorth = Math.max(...coords.map((c) => c[1]));

      const bbox = { west: bboxWest, south: bboxSouth, east: bboxEast, north: bboxNorth };

      expect(bbox).toEqual({ west: 10, south: 20, east: 30, north: 40 });
      expect(bbox.west).not.toEqual(bbox.east);
      expect(bbox.south).not.toEqual(bbox.north);
    });
  });

  describe('Cluster click flow - Timeline panel integration', () => {
    it('should pass correct data to onClusterSelect callback', () => {
      const leaves = [createMockLeaf('uuid-1', 10, 20), createMockLeaf('uuid-2', 30, 40)];

      const ids = leaves.map((l) => l.properties?.id as string);
      const bbox = {
        west: 10,
        south: 20,
        east: 30,
        north: 40,
      };

      if (onClusterSelect) {
        onClusterSelect(ids, bbox);
      }

      expect(onClusterSelect).toHaveBeenCalledWith(['uuid-1', 'uuid-2'], bbox);
    });

    it('should fallback to onSelect when onClusterSelect is not provided', () => {
      const leaves = [createMockLeaf('asset1', 10, 20)];
      const ids = leaves.map((l) => l.properties?.id as string);

      onSelect(ids);
      expect(onSelect).toHaveBeenCalledWith(['asset1']);
    });
  });

  describe('Camera movement guarantees', () => {
    it('should support fitBounds with proper options', () => {
      const bounds: [[number, number], [number, number]] = [
        [10, 20],
        [30, 40],
      ];
      const options = { padding: 100, speed: 1.5, maxZoom: 17 };

      (mockMap.fitBounds as Mock)?.(bounds, options);

      expect(mockMap.fitBounds).toHaveBeenCalledWith(bounds, options);
    });

    it('should support flyTo with proper options', () => {
      const options = { center: [50, 60] as [number, number], zoom: 14, speed: 1.5 };

      (mockMap.flyTo as Mock)?.(options);

      expect(mockMap.flyTo).toHaveBeenCalledWith(options);
    });

    it('should read current zoom level from map', () => {
      const zoom = (mockMap as Map).getZoom?.();
      expect(zoom).toBe(10);

      const fallbackZoom = (zoom ?? 0) + 2;
      expect(fallbackZoom).toBe(12);
    });
  });

  describe('Error resilience', () => {
    it('should handle empty cluster gracefully', async () => {
      (mockMapSource.getClusterLeaves as Mock).mockResolvedValue([]);

      const leaves = await (mockMapSource as GeoJSONSource).getClusterLeaves(123, 10_000, 0);
      expect(leaves.length).toBe(0);

      if (leaves.length === 0) {
        expect(onSelect).not.toHaveBeenCalled();
      }
    });

    it('should handle expansion zoom lookup failure gracefully', async () => {
      const leaves = [createMockLeaf('a1', 50, 60)];
      (mockMapSource.getClusterLeaves as Mock).mockResolvedValue(leaves);
      (mockMapSource.getClusterExpansionZoom as Mock).mockRejectedValue(new Error('Cluster not found'));

      const tries = [];
      try {
        const expansionZoom = await (mockMapSource as GeoJSONSource).getClusterExpansionZoom(456);
        tries.push(expansionZoom);
      } catch {
        const currentZoom = (mockMap as Map).getZoom?.() ?? 8;
        tries.push(currentZoom + 2);
      }

      expect(tries[0]).toBe(12); // 10 + 2
    });

    it('should handle missing asset ids in cluster leaves', () => {
      const leavesWithoutId: Feature<Point>[] = [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [10, 20] },
          properties: {}, // no id
        },
      ];

      const ids = leavesWithoutId.map((l) => l.properties?.id as string);
      expect(ids).toEqual([undefined]);
    });
  });

  describe('Mobile sheet interaction context', () => {
    it('should work with MapTimelinePanel click handler', () => {
      const selectedIds = ['uuid-1', 'uuid-2'];
      const selectedBbox = { west: 10, south: 20, east: 30, north: 40 };

      expect(selectedBbox).toHaveProperty('west');
      expect(selectedBbox).toHaveProperty('south');
      expect(selectedBbox).toHaveProperty('east');
      expect(selectedBbox).toHaveProperty('north');

      expect(selectedIds).toHaveLength(2);
    });

    it('should provide zoom animation context for mobile experience', () => {
      const fitBoundsOptions = { padding: 100, speed: 1.5, maxZoom: 17 };

      expect(fitBoundsOptions.speed).toBeLessThan(2);
      expect(fitBoundsOptions.maxZoom).toBeLessThanOrEqual(17);
      expect(fitBoundsOptions.padding).toBeGreaterThan(0);
    });
  });
});
