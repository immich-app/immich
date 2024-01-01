import 'package:immich_mobile/modules/map/models/map_marker.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class MapUtils {
  MapUtils._();
  static const defaultSourceId = 'asset-map-markers';
  static const defaultHeatMapLayerId = 'asset-heatmap-layer';

  static const defaultHeatMapLayerProperties = HeatmapLayerProperties(
    heatmapColor: [
      Expressions.interpolate,
      ["linear"],
      ["heatmap-density"],
      0.0,
      "rgba(246,239,247,0.0)",
      0.2,
      "rgb(208,209,230)",
      0.4,
      "rgb(166,189,219)",
      0.6,
      "rgb(103,169,207)",
      0.8,
      "rgb(28,144,153)",
      1.0,
      "rgb(1,108,89)",
    ],
    heatmapIntensity: [
      Expressions.interpolate, ["linear"], //
      [Expressions.zoom],
      0, 0.5,
      9, 2,
    ],
    heatmapRadius: [
      Expressions.interpolate, ["linear"], //
      [Expressions.zoom],
      0, 4,
      4, 8,
      9, 16,
    ],
  );

  static Map<String, dynamic> _addFeature(MapMarker marker) => {
        'type': 'Feature',
        'id': marker.assetRemoteId,
        'geometry': {
          'type': 'Point',
          'coordinates': [marker.latLng.longitude, marker.latLng.latitude],
        },
      };

  static Map<String, dynamic> generateGeoJsonForMarkers(
    List<MapMarker> markers,
  ) =>
      {
        'type': 'FeatureCollection',
        'features': markers.map(_addFeature).toList(),
      };
}
