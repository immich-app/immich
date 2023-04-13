import 'package:isar/isar.dart';
import 'package:openapi/api.dart';
import 'package:immich_mobile/utils/builtin_extensions.dart';

part 'exif_info.g.dart';

/// Exif information 1:1 relation with Asset
@Collection(inheritance: false)
class ExifInfo {
  Id? id;
  int? fileSize;
  String? make;
  String? model;
  String? lens;
  float? f;
  float? mm;
  short? iso;
  float? exposureSeconds;
  float? lat;
  float? long;
  String? city;
  String? state;
  String? country;
  String? description;

  @ignore
  String get exposureTime {
    if (exposureSeconds == null) {
      return "";
    } else if (exposureSeconds! < 1) {
      return "1/${(1.0 / exposureSeconds!).round()} s";
    } else {
      return "${exposureSeconds!.toStringAsFixed(1)} s";
    }
  }

  @ignore
  String get fNumber => f != null ? f!.toStringAsFixed(1) : "";

  @ignore
  String get focalLength => mm != null ? mm!.toStringAsFixed(1) : "";

  @ignore
  double? get latitude => lat;

  @ignore
  double? get longitude => long;

  ExifInfo.fromDto(ExifResponseDto dto)
      : fileSize = dto.fileSizeInByte,
        make = dto.make,
        model = dto.model,
        lens = dto.lensModel,
        f = dto.fNumber?.toDouble(),
        mm = dto.focalLength?.toDouble(),
        iso = dto.iso?.toInt(),
        exposureSeconds = _exposureTimeToSeconds(dto.exposureTime),
        lat = dto.latitude?.toDouble(),
        long = dto.longitude?.toDouble(),
        city = dto.city,
        state = dto.state,
        country = dto.country,
        description = dto.description;

  ExifInfo({
    this.fileSize,
    this.make,
    this.model,
    this.lens,
    this.f,
    this.mm,
    this.iso,
    this.exposureSeconds,
    this.lat,
    this.long,
    this.city,
    this.state,
    this.country,
    this.description,
  });
}

double? _exposureTimeToSeconds(String? s) {
  if (s == null) {
    return null;
  }
  double? value = double.tryParse(s);
  if (value != null) {
    return value;
  }
  final parts = s.split("/");
  if (parts.length == 2) {
    return parts[0].toDouble() / parts[1].toDouble();
  }
  return null;
}
