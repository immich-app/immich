import type { Point } from 'geojson';
import type { GeoJSONSource, Map } from 'maplibre-gl';

export interface SelectionBBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export async function autoZoomCluster({
  map,
  mapSource,
  clusterId,
  onClusterSelect,
  onSelect,
}: {
  map: Map;
  mapSource: GeoJSONSource;
  clusterId: number;
  onClusterSelect?: (assetIds: string[], bbox: SelectionBBox) => void;
  onSelect: (assetIds: string[]) => void;
}): Promise<void> {
  const leaves = await mapSource.getClusterLeaves(clusterId, 10_000, 0);
  const ids = leaves.map((leaf) => leaf.properties?.id as string);

  if (leaves.length === 0) {
    return;
  }

  const [firstLongitude, firstLatitude] = (leaves[0].geometry as Point).coordinates;
  let west = firstLongitude;
  let south = firstLatitude;
  let east = firstLongitude;
  let north = firstLatitude;

  for (const leaf of leaves.slice(1)) {
    const [longitude, latitude] = (leaf.geometry as Point).coordinates;
    west = Math.min(west, longitude);
    south = Math.min(south, latitude);
    east = Math.max(east, longitude);
    north = Math.max(north, latitude);
  }

  const bbox: SelectionBBox = { west, south, east, north };

  if (west !== east || south !== north) {
    map.fitBounds(
      [
        [west, south],
        [east, north],
      ],
      { padding: 100, speed: 1.5, maxZoom: 17 },
    );
  } else {
    try {
      const expansionZoom = await mapSource.getClusterExpansionZoom(clusterId);
      map.flyTo({
        center: [west, south],
        zoom: expansionZoom ?? map.getZoom() + 2,
        speed: 1.5,
      });
    } catch {
      map.flyTo({
        center: [west, south],
        zoom: map.getZoom() + 2,
        speed: 1.5,
      });
    }
  }

  if (onClusterSelect) {
    onClusterSelect(ids, bbox);
    return;
  }

  onSelect(ids);
}
