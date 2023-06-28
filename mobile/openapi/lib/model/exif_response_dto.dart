//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ExifResponseDto {
  /// Returns a new [ExifResponseDto] instance.
  ExifResponseDto({
    this.fileSizeInByte,
    this.make,
    this.model,
    this.exifImageWidth,
    this.exifImageHeight,
    this.orientation,
    this.dateTimeOriginal,
    this.modifyDate,
    this.timeZone,
    this.lensModel,
    this.fNumber,
    this.focalLength,
    this.iso,
    this.exposureTime,
    this.latitude,
    this.longitude,
    this.city,
    this.state,
    this.country,
    this.description,
  });

  int? fileSizeInByte;

  String? make;

  String? model;

  num? exifImageWidth;

  num? exifImageHeight;

  String? orientation;

  DateTime? dateTimeOriginal;

  DateTime? modifyDate;

  String? timeZone;

  String? lensModel;

  num? fNumber;

  num? focalLength;

  num? iso;

  String? exposureTime;

  num? latitude;

  num? longitude;

  String? city;

  String? state;

  String? country;

  String? description;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ExifResponseDto &&
     other.fileSizeInByte == fileSizeInByte &&
     other.make == make &&
     other.model == model &&
     other.exifImageWidth == exifImageWidth &&
     other.exifImageHeight == exifImageHeight &&
     other.orientation == orientation &&
     other.dateTimeOriginal == dateTimeOriginal &&
     other.modifyDate == modifyDate &&
     other.timeZone == timeZone &&
     other.lensModel == lensModel &&
     other.fNumber == fNumber &&
     other.focalLength == focalLength &&
     other.iso == iso &&
     other.exposureTime == exposureTime &&
     other.latitude == latitude &&
     other.longitude == longitude &&
     other.city == city &&
     other.state == state &&
     other.country == country &&
     other.description == description;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (fileSizeInByte == null ? 0 : fileSizeInByte!.hashCode) +
    (make == null ? 0 : make!.hashCode) +
    (model == null ? 0 : model!.hashCode) +
    (exifImageWidth == null ? 0 : exifImageWidth!.hashCode) +
    (exifImageHeight == null ? 0 : exifImageHeight!.hashCode) +
    (orientation == null ? 0 : orientation!.hashCode) +
    (dateTimeOriginal == null ? 0 : dateTimeOriginal!.hashCode) +
    (modifyDate == null ? 0 : modifyDate!.hashCode) +
    (timeZone == null ? 0 : timeZone!.hashCode) +
    (lensModel == null ? 0 : lensModel!.hashCode) +
    (fNumber == null ? 0 : fNumber!.hashCode) +
    (focalLength == null ? 0 : focalLength!.hashCode) +
    (iso == null ? 0 : iso!.hashCode) +
    (exposureTime == null ? 0 : exposureTime!.hashCode) +
    (latitude == null ? 0 : latitude!.hashCode) +
    (longitude == null ? 0 : longitude!.hashCode) +
    (city == null ? 0 : city!.hashCode) +
    (state == null ? 0 : state!.hashCode) +
    (country == null ? 0 : country!.hashCode) +
    (description == null ? 0 : description!.hashCode);

  @override
  String toString() => 'ExifResponseDto[fileSizeInByte=$fileSizeInByte, make=$make, model=$model, exifImageWidth=$exifImageWidth, exifImageHeight=$exifImageHeight, orientation=$orientation, dateTimeOriginal=$dateTimeOriginal, modifyDate=$modifyDate, timeZone=$timeZone, lensModel=$lensModel, fNumber=$fNumber, focalLength=$focalLength, iso=$iso, exposureTime=$exposureTime, latitude=$latitude, longitude=$longitude, city=$city, state=$state, country=$country, description=$description]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.fileSizeInByte != null) {
      json[r'fileSizeInByte'] = this.fileSizeInByte;
    } else {
    //  json[r'fileSizeInByte'] = null;
    }
    if (this.make != null) {
      json[r'make'] = this.make;
    } else {
    //  json[r'make'] = null;
    }
    if (this.model != null) {
      json[r'model'] = this.model;
    } else {
    //  json[r'model'] = null;
    }
    if (this.exifImageWidth != null) {
      json[r'exifImageWidth'] = this.exifImageWidth;
    } else {
    //  json[r'exifImageWidth'] = null;
    }
    if (this.exifImageHeight != null) {
      json[r'exifImageHeight'] = this.exifImageHeight;
    } else {
    //  json[r'exifImageHeight'] = null;
    }
    if (this.orientation != null) {
      json[r'orientation'] = this.orientation;
    } else {
    //  json[r'orientation'] = null;
    }
    if (this.dateTimeOriginal != null) {
      json[r'dateTimeOriginal'] = this.dateTimeOriginal!.toUtc().toIso8601String();
    } else {
    //  json[r'dateTimeOriginal'] = null;
    }
    if (this.modifyDate != null) {
      json[r'modifyDate'] = this.modifyDate!.toUtc().toIso8601String();
    } else {
    //  json[r'modifyDate'] = null;
    }
    if (this.timeZone != null) {
      json[r'timeZone'] = this.timeZone;
    } else {
    //  json[r'timeZone'] = null;
    }
    if (this.lensModel != null) {
      json[r'lensModel'] = this.lensModel;
    } else {
    //  json[r'lensModel'] = null;
    }
    if (this.fNumber != null) {
      json[r'fNumber'] = this.fNumber;
    } else {
    //  json[r'fNumber'] = null;
    }
    if (this.focalLength != null) {
      json[r'focalLength'] = this.focalLength;
    } else {
    //  json[r'focalLength'] = null;
    }
    if (this.iso != null) {
      json[r'iso'] = this.iso;
    } else {
    //  json[r'iso'] = null;
    }
    if (this.exposureTime != null) {
      json[r'exposureTime'] = this.exposureTime;
    } else {
    //  json[r'exposureTime'] = null;
    }
    if (this.latitude != null) {
      json[r'latitude'] = this.latitude;
    } else {
    //  json[r'latitude'] = null;
    }
    if (this.longitude != null) {
      json[r'longitude'] = this.longitude;
    } else {
    //  json[r'longitude'] = null;
    }
    if (this.city != null) {
      json[r'city'] = this.city;
    } else {
    //  json[r'city'] = null;
    }
    if (this.state != null) {
      json[r'state'] = this.state;
    } else {
    //  json[r'state'] = null;
    }
    if (this.country != null) {
      json[r'country'] = this.country;
    } else {
    //  json[r'country'] = null;
    }
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
    return json;
  }

  /// Returns a new [ExifResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ExifResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ExifResponseDto(
        fileSizeInByte: mapValueOfType<int>(json, r'fileSizeInByte'),
        make: mapValueOfType<String>(json, r'make'),
        model: mapValueOfType<String>(json, r'model'),
        exifImageWidth: json[r'exifImageWidth'] == null
            ? null
            : num.parse(json[r'exifImageWidth'].toString()),
        exifImageHeight: json[r'exifImageHeight'] == null
            ? null
            : num.parse(json[r'exifImageHeight'].toString()),
        orientation: mapValueOfType<String>(json, r'orientation'),
        dateTimeOriginal: mapDateTime(json, r'dateTimeOriginal', ''),
        modifyDate: mapDateTime(json, r'modifyDate', ''),
        timeZone: mapValueOfType<String>(json, r'timeZone'),
        lensModel: mapValueOfType<String>(json, r'lensModel'),
        fNumber: json[r'fNumber'] == null
            ? null
            : num.parse(json[r'fNumber'].toString()),
        focalLength: json[r'focalLength'] == null
            ? null
            : num.parse(json[r'focalLength'].toString()),
        iso: json[r'iso'] == null
            ? null
            : num.parse(json[r'iso'].toString()),
        exposureTime: mapValueOfType<String>(json, r'exposureTime'),
        latitude: json[r'latitude'] == null
            ? null
            : num.parse(json[r'latitude'].toString()),
        longitude: json[r'longitude'] == null
            ? null
            : num.parse(json[r'longitude'].toString()),
        city: mapValueOfType<String>(json, r'city'),
        state: mapValueOfType<String>(json, r'state'),
        country: mapValueOfType<String>(json, r'country'),
        description: mapValueOfType<String>(json, r'description'),
      );
    }
    return null;
  }

  static List<ExifResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ExifResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ExifResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ExifResponseDto> mapFromJson(dynamic json) {
    final map = <String, ExifResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ExifResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ExifResponseDto-objects as value to a dart map
  static Map<String, List<ExifResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ExifResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ExifResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

