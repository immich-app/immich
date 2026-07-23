import 'package:freezed_annotation/freezed_annotation.dart';

part 'exif.model.freezed.dart';

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
