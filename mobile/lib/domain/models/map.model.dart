import 'package:maplibre_gl/maplibre_gl.dart';

class Marker {
  final LatLng location;
  final String assetId;

  const Marker({required this.location, required this.assetId});

  @override
  bool operator ==(covariant Marker other) {
    if (identical(this, other)) return true;

    return other.location == location && other.assetId == assetId;
  }

  @override
  int get hashCode => location.hashCode ^ assetId.hashCode;
}
