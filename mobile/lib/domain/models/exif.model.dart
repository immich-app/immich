import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'exif.model.freezed.dart';

// Aligned with web: https://github.com/immich-app/immich/blob/main/web/src/lib/constants.ts
enum ProjectionType {
  equirectangular('EQUIRECTANGULAR'),
  cubemap('CUBEMAP'),
  cubestrip('CUBESTRIP'),
  equirectangularStereo('EQUIRECTANGULAR_STEREO'),
  cubemapStereo('CUBEMAP_STEREO'),
  cubestripStereo('CUBESTRIP_STEREO'),
  cylinder('CYLINDER'),
  none('NONE');

  const ProjectionType(this.value);
  final String value;
  static ProjectionType? fromValue(String? value) => values.where((type) => type.value == value).firstOrNull;
}

@freezed
abstract class ExifInfo with _$ExifInfo {
  const ExifInfo._();

  const factory ExifInfo({
    int? assetId,
    int? fileSize,
    String? description,
    @Default(false) bool isFlipped,
    String? orientation,
    String? timeZone,
    DateTime? dateTimeOriginal,
    int? rating,
    int? width,
    int? height,
    ProjectionType? projectionType,

    // GPS
    double? latitude,
    double? longitude,
    String? city,
    String? state,
    String? country,

    // Camera related
    String? make,
    String? model,
    String? lens,
    double? f,
    double? mm,
    int? iso,
    double? exposureSeconds,
  }) = _ExifInfo;

  bool get hasCoordinates => latitude != null && longitude != null && latitude != 0 && longitude != 0;

  String get exposureTime {
    if (exposureSeconds == null || exposureSeconds! <= 0 || exposureSeconds!.isNaN) {
      return "";
    }
    if (exposureSeconds! < 1) {
      return "1/${(1.0 / exposureSeconds!).round()} s";
    }
    return "${exposureSeconds!.toStringAsFixed(1)} s";
  }

  String get fNumber => f == null ? "" : f!.toStringAsFixed(1);

  String get focalLength => mm == null ? "" : mm!.toStringAsFixed(3);
}
