// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:openapi/api.dart';

part 'map_marker.model.freezed.dart';

@freezed
class const MapMarker({required final LatLng latLng, required final String assetRemoteId}) with _$MapMarker {
  factory MapMarker.fromDto(MapMarkerResponseDto dto) =>
      MapMarker(latLng: LatLng(dto.lat, dto.lon), assetRemoteId: dto.id);
}
