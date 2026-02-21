import 'dart:async';
import 'dart:convert';

import 'package:immich_mobile/models/map/map_marker.model.dart';
import 'package:immich_mobile/utils/map_utils.dart';
import 'package:maplibre/maplibre.dart';

extension MapMarkers on MapController {
  static var _completer = Completer()..complete();

  Future<void> addGeoJSONSourceForMarkers(List<MapMarker> markers) async {
    return style!.addSource(
      GeoJsonSource(
        id: MapUtils.defaultSourceId,
        data: jsonEncode(MapUtils.generateGeoJsonForMarkers(markers.toList())),
      ),
    );
  }

  Future<void> reloadAllLayersForMarkers(List<MapMarker> markers) async {
    // Wait for previous reload to complete
    if (!_completer.isCompleted) {
      return _completer.future;
    }
    _completer = Completer();

    // !! Make sure to remove layers before sources else the native
    // maplibre library would crash when removing the source saying that
    // the source is still in use
    try {
      await style!.removeLayer(MapUtils.defaultHeatMapLayerId);
    } catch (_) {
      // Layer may not exist
    }

    try {
      await style!.removeSource(MapUtils.defaultSourceId);
    } catch (_) {
      // Source may not exist
    }

    await addGeoJSONSourceForMarkers(markers);

    await style!.addLayer(
      const HeatmapStyleLayer(
        id: MapUtils.defaultHeatMapLayerId,
        sourceId: MapUtils.defaultSourceId,
        paint: MapUtils.defaultHeatMapLayerPaint,
      ),
    );

    _completer.complete();
  }
}
