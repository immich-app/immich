import 'package:immich_mobile/domain/models/map.model.dart';

class MarkerBuilder {
  final List<Marker> markers;

  const MarkerBuilder({required this.markers});

  static Map<String, dynamic> addFeature(Marker marker) =>
      {
        'type': 'Feature',
        'id': marker.assetId,
        'geometry': {
          'type': 'Point',
          'coordinates': [marker.location.longitude, marker.location.latitude],
        },
      };

  Map<String, dynamic> generate() =>
      {
        'type': 'FeatureCollection',
        'features': markers.map(addFeature).toList(),
      };
}
