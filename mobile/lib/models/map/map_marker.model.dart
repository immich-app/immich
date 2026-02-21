import 'package:maplibre/maplibre.dart';
import 'package:openapi/api.dart';

class MapMarker {
  final Geographic latLng;
  final String assetRemoteId;
  const MapMarker({required this.latLng, required this.assetRemoteId});

  MapMarker copyWith({Geographic? latLng, String? assetRemoteId}) {
    return MapMarker(latLng: latLng ?? this.latLng, assetRemoteId: assetRemoteId ?? this.assetRemoteId);
  }

  MapMarker.fromDto(MapMarkerResponseDto dto) : latLng = Geographic(lat: dto.lat, lon: dto.lon), assetRemoteId = dto.id;

  @override
  String toString() => 'MapMarker(latLng: $latLng, assetRemoteId: $assetRemoteId)';

  @override
  bool operator ==(covariant MapMarker other) {
    if (identical(this, other)) return true;

    return other.latLng == latLng && other.assetRemoteId == assetRemoteId;
  }

  @override
  int get hashCode => latLng.hashCode ^ assetRemoteId.hashCode;
}
