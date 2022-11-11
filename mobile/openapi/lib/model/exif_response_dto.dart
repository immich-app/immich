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
    this.id,
    this.fileSizeInByte,
    this.make,
    this.model,
    this.imageName,
    this.exifImageWidth,
    this.exifImageHeight,
    this.orientation,
    this.dateTimeOriginal,
    this.modifyDate,
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
  });

  int? id;

  int? fileSizeInByte;

  String? make;

  String? model;

  String? imageName;

  num? exifImageWidth;

  num? exifImageHeight;

  String? orientation;

  DateTime? dateTimeOriginal;

  DateTime? modifyDate;

  String? lensModel;

  num? fNumber;

  num? focalLength;

  num? iso;

  num? exposureTime;

  num? latitude;

  num? longitude;

  String? city;

  String? state;

  String? country;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ExifResponseDto &&
     other.id == id &&
     other.fileSizeInByte == fileSizeInByte &&
     other.make == make &&
     other.model == model &&
     other.imageName == imageName &&
     other.exifImageWidth == exifImageWidth &&
     other.exifImageHeight == exifImageHeight &&
     other.orientation == orientation &&
     other.dateTimeOriginal == dateTimeOriginal &&
     other.modifyDate == modifyDate &&
     other.lensModel == lensModel &&
     other.fNumber == fNumber &&
     other.focalLength == focalLength &&
     other.iso == iso &&
     other.exposureTime == exposureTime &&
     other.latitude == latitude &&
     other.longitude == longitude &&
     other.city == city &&
     other.state == state &&
     other.country == country;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id == null ? 0 : id!.hashCode) +
    (fileSizeInByte == null ? 0 : fileSizeInByte!.hashCode) +
    (make == null ? 0 : make!.hashCode) +
    (model == null ? 0 : model!.hashCode) +
    (imageName == null ? 0 : imageName!.hashCode) +
    (exifImageWidth == null ? 0 : exifImageWidth!.hashCode) +
    (exifImageHeight == null ? 0 : exifImageHeight!.hashCode) +
    (orientation == null ? 0 : orientation!.hashCode) +
    (dateTimeOriginal == null ? 0 : dateTimeOriginal!.hashCode) +
    (modifyDate == null ? 0 : modifyDate!.hashCode) +
    (lensModel == null ? 0 : lensModel!.hashCode) +
    (fNumber == null ? 0 : fNumber!.hashCode) +
    (focalLength == null ? 0 : focalLength!.hashCode) +
    (iso == null ? 0 : iso!.hashCode) +
    (exposureTime == null ? 0 : exposureTime!.hashCode) +
    (latitude == null ? 0 : latitude!.hashCode) +
    (longitude == null ? 0 : longitude!.hashCode) +
    (city == null ? 0 : city!.hashCode) +
    (state == null ? 0 : state!.hashCode) +
    (country == null ? 0 : country!.hashCode);

  @override
  String toString() => 'ExifResponseDto[id=$id, fileSizeInByte=$fileSizeInByte, make=$make, model=$model, imageName=$imageName, exifImageWidth=$exifImageWidth, exifImageHeight=$exifImageHeight, orientation=$orientation, dateTimeOriginal=$dateTimeOriginal, modifyDate=$modifyDate, lensModel=$lensModel, fNumber=$fNumber, focalLength=$focalLength, iso=$iso, exposureTime=$exposureTime, latitude=$latitude, longitude=$longitude, city=$city, state=$state, country=$country]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
    if (id != null) {
      _json[r'id'] = id;
    } else {
      _json[r'id'] = null;
    }
    if (fileSizeInByte != null) {
      _json[r'fileSizeInByte'] = fileSizeInByte;
    } else {
      _json[r'fileSizeInByte'] = null;
    }
    if (make != null) {
      _json[r'make'] = make;
    } else {
      _json[r'make'] = null;
    }
    if (model != null) {
      _json[r'model'] = model;
    } else {
      _json[r'model'] = null;
    }
    if (imageName != null) {
      _json[r'imageName'] = imageName;
    } else {
      _json[r'imageName'] = null;
    }
    if (exifImageWidth != null) {
      _json[r'exifImageWidth'] = exifImageWidth;
    } else {
      _json[r'exifImageWidth'] = null;
    }
    if (exifImageHeight != null) {
      _json[r'exifImageHeight'] = exifImageHeight;
    } else {
      _json[r'exifImageHeight'] = null;
    }
    if (orientation != null) {
      _json[r'orientation'] = orientation;
    } else {
      _json[r'orientation'] = null;
    }
    if (dateTimeOriginal != null) {
      _json[r'dateTimeOriginal'] = dateTimeOriginal!.toUtc().toIso8601String();
    } else {
      _json[r'dateTimeOriginal'] = null;
    }
    if (modifyDate != null) {
      _json[r'modifyDate'] = modifyDate!.toUtc().toIso8601String();
    } else {
      _json[r'modifyDate'] = null;
    }
    if (lensModel != null) {
      _json[r'lensModel'] = lensModel;
    } else {
      _json[r'lensModel'] = null;
    }
    if (fNumber != null) {
      _json[r'fNumber'] = fNumber;
    } else {
      _json[r'fNumber'] = null;
    }
    if (focalLength != null) {
      _json[r'focalLength'] = focalLength;
    } else {
      _json[r'focalLength'] = null;
    }
    if (iso != null) {
      _json[r'iso'] = iso;
    } else {
      _json[r'iso'] = null;
    }
    if (exposureTime != null) {
      _json[r'exposureTime'] = exposureTime;
    } else {
      _json[r'exposureTime'] = null;
    }
    if (latitude != null) {
      _json[r'latitude'] = latitude;
    } else {
      _json[r'latitude'] = null;
    }
    if (longitude != null) {
      _json[r'longitude'] = longitude;
    } else {
      _json[r'longitude'] = null;
    }
    if (city != null) {
      _json[r'city'] = city;
    } else {
      _json[r'city'] = null;
    }
    if (state != null) {
      _json[r'state'] = state;
    } else {
      _json[r'state'] = null;
    }
    if (country != null) {
      _json[r'country'] = country;
    } else {
      _json[r'country'] = null;
    }
    return _json;
  }

  /// Returns a new [ExifResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ExifResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "ExifResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "ExifResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return ExifResponseDto(
        id: mapValueOfType<int>(json, r'id'),
        fileSizeInByte: mapValueOfType<int>(json, r'fileSizeInByte'),
        make: mapValueOfType<String>(json, r'make'),
        model: mapValueOfType<String>(json, r'model'),
        imageName: mapValueOfType<String>(json, r'imageName'),
        exifImageWidth: json[r'exifImageWidth'] == null
            ? null
            : num.parse(json[r'exifImageWidth'].toString()),
        exifImageHeight: json[r'exifImageHeight'] == null
            ? null
            : num.parse(json[r'exifImageHeight'].toString()),
        orientation: mapValueOfType<String>(json, r'orientation'),
        dateTimeOriginal: mapDateTime(json, r'dateTimeOriginal', ''),
        modifyDate: mapDateTime(json, r'modifyDate', ''),
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
        exposureTime: json[r'exposureTime'] == null
            ? null
            : num.parse(json[r'exposureTime'].toString()),
        latitude: json[r'latitude'] == null
            ? null
            : num.parse(json[r'latitude'].toString()),
        longitude: json[r'longitude'] == null
            ? null
            : num.parse(json[r'longitude'].toString()),
        city: mapValueOfType<String>(json, r'city'),
        state: mapValueOfType<String>(json, r'state'),
        country: mapValueOfType<String>(json, r'country'),
      );
    }
    return null;
  }

  static List<ExifResponseDto>? listFromJson(dynamic json, {bool growable = false,}) {
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
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ExifResponseDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

