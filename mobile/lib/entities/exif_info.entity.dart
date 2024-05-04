import 'package:isar/isar.dart';
import 'package:openapi/api.dart';

part 'exif_info.entity.g.dart';

/// Exif information 1:1 relation with Asset
@Collection(inheritance: false)
class ExifInfo {
  Id? id;
  int? fileSize;
  DateTime? dateTimeOriginal;
  String? timeZone;
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
  bool get hasCoordinates =>
      latitude != null && longitude != null && latitude != 0 && longitude != 0;

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
        dateTimeOriginal = dto.dateTimeOriginal,
        timeZone = dto.timeZone,
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
    this.id,
    this.fileSize,
    this.dateTimeOriginal,
    this.timeZone,
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

  ExifInfo copyWith({
    Id? id,
    int? fileSize,
    DateTime? dateTimeOriginal,
    String? timeZone,
    String? make,
    String? model,
    String? lens,
    float? f,
    float? mm,
    short? iso,
    float? exposureSeconds,
    float? lat,
    float? long,
    String? city,
    String? state,
    String? country,
    String? description,
  }) =>
      ExifInfo(
        id: id ?? this.id,
        fileSize: fileSize ?? this.fileSize,
        dateTimeOriginal: dateTimeOriginal ?? this.dateTimeOriginal,
        timeZone: timeZone ?? this.timeZone,
        make: make ?? this.make,
        model: model ?? this.model,
        lens: lens ?? this.lens,
        f: f ?? this.f,
        mm: mm ?? this.mm,
        iso: iso ?? this.iso,
        exposureSeconds: exposureSeconds ?? this.exposureSeconds,
        lat: lat ?? this.lat,
        long: long ?? this.long,
        city: city ?? this.city,
        state: state ?? this.state,
        country: country ?? this.country,
        description: description ?? this.description,
      );

  @override
  bool operator ==(other) {
    if (other is! ExifInfo) return false;
    return id == other.id &&
        fileSize == other.fileSize &&
        dateTimeOriginal == other.dateTimeOriginal &&
        timeZone == other.timeZone &&
        make == other.make &&
        model == other.model &&
        lens == other.lens &&
        f == other.f &&
        mm == other.mm &&
        iso == other.iso &&
        exposureSeconds == other.exposureSeconds &&
        lat == other.lat &&
        long == other.long &&
        city == other.city &&
        state == other.state &&
        country == other.country &&
        description == other.description;
  }

  @override
  @ignore
  int get hashCode =>
      id.hashCode ^
      fileSize.hashCode ^
      dateTimeOriginal.hashCode ^
      timeZone.hashCode ^
      make.hashCode ^
      model.hashCode ^
      lens.hashCode ^
      f.hashCode ^
      mm.hashCode ^
      iso.hashCode ^
      exposureSeconds.hashCode ^
      lat.hashCode ^
      long.hashCode ^
      city.hashCode ^
      state.hashCode ^
      country.hashCode ^
      description.hashCode;
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
    final numerator = double.tryParse(parts[0]);
    final denominator = double.tryParse(parts[1]);
    if (numerator != null && denominator != null) {
      return numerator / denominator;
    }
  }
  return null;
}
