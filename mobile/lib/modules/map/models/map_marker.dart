import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:openapi/api.dart';

class MapMarker {
  final LatLng latLng;
  final String assetRemoteId;
  MapMarker({
    required this.latLng,
    required this.assetRemoteId,
  });

  MapMarker copyWith({
    LatLng? latLng,
    String? assetRemoteId,
  }) {
    return MapMarker(
      latLng: latLng ?? this.latLng,
      assetRemoteId: assetRemoteId ?? this.assetRemoteId,
    );
  }

  static MapMarker? fromDto(MapMarkerResponseDto dto) {
    if (dto.lat < -90 || dto.lat > 90 || dto.lon < -180 || dto.lon > 180) {
      return null;
    }
    return MapMarker(latLng: LatLng(dto.lat, dto.lon), assetRemoteId: dto.id);
  }

  @override
  String toString() =>
      'MapMarker(latLng: $latLng, assetRemoteId: $assetRemoteId)';

  @override
  bool operator ==(covariant MapMarker other) {
    if (identical(this, other)) return true;

    return other.latLng == latLng && other.assetRemoteId == assetRemoteId;
  }

  @override
  int get hashCode => latLng.hashCode ^ assetRemoteId.hashCode;
}
