//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ExifResponseDto {
  /// Returns a new [ExifResponseDto] instance.
  ExifResponseDto({
    this.city,
    this.country,
    this.dateTimeOriginal,
    this.description,
    this.exifImageHeight,
    this.exifImageWidth,
    this.exposureTime,
    this.fNumber,
    this.fileSizeInByte,
    this.focalLength,
    this.iso,
    this.latitude,
    this.lensModel,
    this.longitude,
    this.make,
    this.model,
    this.modifyDate,
    this.orientation,
    this.projectionType,
    this.state,
    this.timeZone,
  });

  String? city;

  String? country;

  DateTime? dateTimeOriginal;

  String? description;

  num? exifImageHeight;

  num? exifImageWidth;

  String? exposureTime;

  num? fNumber;

  int? fileSizeInByte;

  num? focalLength;

  num? iso;

  num? latitude;

  String? lensModel;

  num? longitude;

  String? make;

  String? model;

  DateTime? modifyDate;

  String? orientation;

  String? projectionType;

  String? state;

  String? timeZone;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ExifResponseDto &&
    other.city == city &&
    other.country == country &&
    other.dateTimeOriginal == dateTimeOriginal &&
    other.description == description &&
    other.exifImageHeight == exifImageHeight &&
    other.exifImageWidth == exifImageWidth &&
    other.exposureTime == exposureTime &&
    other.fNumber == fNumber &&
    other.fileSizeInByte == fileSizeInByte &&
    other.focalLength == focalLength &&
    other.iso == iso &&
    other.latitude == latitude &&
    other.lensModel == lensModel &&
    other.longitude == longitude &&
    other.make == make &&
    other.model == model &&
    other.modifyDate == modifyDate &&
    other.orientation == orientation &&
    other.projectionType == projectionType &&
    other.state == state &&
    other.timeZone == timeZone;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (city == null ? 0 : city!.hashCode) +
    (country == null ? 0 : country!.hashCode) +
    (dateTimeOriginal == null ? 0 : dateTimeOriginal!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (exifImageHeight == null ? 0 : exifImageHeight!.hashCode) +
    (exifImageWidth == null ? 0 : exifImageWidth!.hashCode) +
    (exposureTime == null ? 0 : exposureTime!.hashCode) +
    (fNumber == null ? 0 : fNumber!.hashCode) +
    (fileSizeInByte == null ? 0 : fileSizeInByte!.hashCode) +
    (focalLength == null ? 0 : focalLength!.hashCode) +
    (iso == null ? 0 : iso!.hashCode) +
    (latitude == null ? 0 : latitude!.hashCode) +
    (lensModel == null ? 0 : lensModel!.hashCode) +
    (longitude == null ? 0 : longitude!.hashCode) +
    (make == null ? 0 : make!.hashCode) +
    (model == null ? 0 : model!.hashCode) +
    (modifyDate == null ? 0 : modifyDate!.hashCode) +
    (orientation == null ? 0 : orientation!.hashCode) +
    (projectionType == null ? 0 : projectionType!.hashCode) +
    (state == null ? 0 : state!.hashCode) +
    (timeZone == null ? 0 : timeZone!.hashCode);

  @override
  String toString() => 'ExifResponseDto[city=$city, country=$country, dateTimeOriginal=$dateTimeOriginal, description=$description, exifImageHeight=$exifImageHeight, exifImageWidth=$exifImageWidth, exposureTime=$exposureTime, fNumber=$fNumber, fileSizeInByte=$fileSizeInByte, focalLength=$focalLength, iso=$iso, latitude=$latitude, lensModel=$lensModel, longitude=$longitude, make=$make, model=$model, modifyDate=$modifyDate, orientation=$orientation, projectionType=$projectionType, state=$state, timeZone=$timeZone]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.city != null) {
      json[r'city'] = this.city;
    } else {
    //  json[r'city'] = null;
    }
    if (this.country != null) {
      json[r'country'] = this.country;
    } else {
    //  json[r'country'] = null;
    }
    if (this.dateTimeOriginal != null) {
      json[r'dateTimeOriginal'] = this.dateTimeOriginal!.toUtc().toIso8601String();
    } else {
    //  json[r'dateTimeOriginal'] = null;
    }
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
    if (this.exifImageHeight != null) {
      json[r'exifImageHeight'] = this.exifImageHeight;
    } else {
    //  json[r'exifImageHeight'] = null;
    }
    if (this.exifImageWidth != null) {
      json[r'exifImageWidth'] = this.exifImageWidth;
    } else {
    //  json[r'exifImageWidth'] = null;
    }
    if (this.exposureTime != null) {
      json[r'exposureTime'] = this.exposureTime;
    } else {
    //  json[r'exposureTime'] = null;
    }
    if (this.fNumber != null) {
      json[r'fNumber'] = this.fNumber;
    } else {
    //  json[r'fNumber'] = null;
    }
    if (this.fileSizeInByte != null) {
      json[r'fileSizeInByte'] = this.fileSizeInByte;
    } else {
    //  json[r'fileSizeInByte'] = null;
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
    if (this.latitude != null) {
      json[r'latitude'] = this.latitude;
    } else {
    //  json[r'latitude'] = null;
    }
    if (this.lensModel != null) {
      json[r'lensModel'] = this.lensModel;
    } else {
    //  json[r'lensModel'] = null;
    }
    if (this.longitude != null) {
      json[r'longitude'] = this.longitude;
    } else {
    //  json[r'longitude'] = null;
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
    if (this.modifyDate != null) {
      json[r'modifyDate'] = this.modifyDate!.toUtc().toIso8601String();
    } else {
    //  json[r'modifyDate'] = null;
    }
    if (this.orientation != null) {
      json[r'orientation'] = this.orientation;
    } else {
    //  json[r'orientation'] = null;
    }
    if (this.projectionType != null) {
      json[r'projectionType'] = this.projectionType;
    } else {
    //  json[r'projectionType'] = null;
    }
    if (this.state != null) {
      json[r'state'] = this.state;
    } else {
    //  json[r'state'] = null;
    }
    if (this.timeZone != null) {
      json[r'timeZone'] = this.timeZone;
    } else {
    //  json[r'timeZone'] = null;
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
        city: mapValueOfType<String>(json, r'city'),
        country: mapValueOfType<String>(json, r'country'),
        dateTimeOriginal: mapDateTime(json, r'dateTimeOriginal', r''),
        description: mapValueOfType<String>(json, r'description'),
        exifImageHeight: json[r'exifImageHeight'] == null
            ? null
            : num.parse('${json[r'exifImageHeight']}'),
        exifImageWidth: json[r'exifImageWidth'] == null
            ? null
            : num.parse('${json[r'exifImageWidth']}'),
        exposureTime: mapValueOfType<String>(json, r'exposureTime'),
        fNumber: json[r'fNumber'] == null
            ? null
            : num.parse('${json[r'fNumber']}'),
        fileSizeInByte: mapValueOfType<int>(json, r'fileSizeInByte'),
        focalLength: json[r'focalLength'] == null
            ? null
            : num.parse('${json[r'focalLength']}'),
        iso: json[r'iso'] == null
            ? null
            : num.parse('${json[r'iso']}'),
        latitude: json[r'latitude'] == null
            ? null
            : num.parse('${json[r'latitude']}'),
        lensModel: mapValueOfType<String>(json, r'lensModel'),
        longitude: json[r'longitude'] == null
            ? null
            : num.parse('${json[r'longitude']}'),
        make: mapValueOfType<String>(json, r'make'),
        model: mapValueOfType<String>(json, r'model'),
        modifyDate: mapDateTime(json, r'modifyDate', r''),
        orientation: mapValueOfType<String>(json, r'orientation'),
        projectionType: mapValueOfType<String>(json, r'projectionType'),
        state: mapValueOfType<String>(json, r'state'),
        timeZone: mapValueOfType<String>(json, r'timeZone'),
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

