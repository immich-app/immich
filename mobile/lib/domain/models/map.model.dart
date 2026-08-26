// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

part 'map.model.freezed.dart';

@freezed
class const Marker({required final LatLng location, required final String assetId}) with _$Marker;
