import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

part 'map.model.freezed.dart';

@freezed
abstract class Marker with _$Marker {
  const factory Marker({required LatLng location, required String assetId}) = _Marker;
}
