import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:openapi/api.dart';

part 'map_marker.model.freezed.dart';

@freezed
abstract class MapMarker with _$MapMarker {
  const factory MapMarker({required LatLng latLng, required String assetRemoteId}) = _MapMarker;

  factory MapMarker.fromDto(MapMarkerResponseDto dto) =>
      MapMarker(latLng: LatLng(dto.lat, dto.lon), assetRemoteId: dto.id);
}
