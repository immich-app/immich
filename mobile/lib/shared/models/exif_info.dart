import 'package:openapi/api.dart';
import 'package:immich_mobile/utils/builtin_extensions.dart';

class ExifInfo {
  int? fileSize;
  String? make;
  String? model;
  String? orientation;
  String? lensModel;
  double? fNumber;
  double? focalLength;
  int? iso;
  double? exposureTime;
  String? city;
  String? state;
  String? country;

  ExifInfo.fromDto(ExifResponseDto dto)
      : fileSize = dto.fileSizeInByte,
        make = dto.make,
        model = dto.model,
        orientation = dto.orientation,
        lensModel = dto.lensModel,
        fNumber = dto.fNumber?.toDouble(),
        focalLength = dto.focalLength?.toDouble(),
        iso = dto.iso?.toInt(),
        exposureTime = dto.exposureTime?.toDouble(),
        city = dto.city,
        state = dto.state,
        country = dto.country;

  // stuff below is only required for caching as JSON

  ExifInfo(
    this.fileSize,
    this.make,
    this.model,
    this.orientation,
    this.lensModel,
    this.fNumber,
    this.focalLength,
    this.iso,
    this.exposureTime,
    this.city,
    this.state,
    this.country,
  );

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json["fileSize"] = fileSize;
    json["make"] = make;
    json["model"] = model;
    json["orientation"] = orientation;
    json["lensModel"] = lensModel;
    json["fNumber"] = fNumber;
    json["focalLength"] = focalLength;
    json["iso"] = iso;
    json["exposureTime"] = exposureTime;
    json["city"] = city;
    json["state"] = state;
    json["country"] = country;
    return json;
  }

  static ExifInfo? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();
      return ExifInfo(
        json["fileSize"],
        json["make"],
        json["model"],
        json["orientation"],
        json["lensModel"],
        json["fNumber"],
        json["focalLength"],
        json["iso"],
        json["exposureTime"],
        json["city"],
        json["state"],
        json["country"],
      );
    }
    return null;
  }
}
