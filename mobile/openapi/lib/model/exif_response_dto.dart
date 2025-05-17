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
    this.rating,
    this.state,
    this.timeZone,
  });

  Option<String>? city;

  Option<String>? country;

  Option<DateTime>? dateTimeOriginal;

  Option<String>? description;

  Option<num>? exifImageHeight;

  Option<num>? exifImageWidth;

  Option<String>? exposureTime;

  Option<num>? fNumber;

  Option<int>? fileSizeInByte;

  Option<num>? focalLength;

  Option<num>? iso;

  Option<num>? latitude;

  Option<String>? lensModel;

  Option<num>? longitude;

  Option<String>? make;

  Option<String>? model;

  Option<DateTime>? modifyDate;

  Option<String>? orientation;

  Option<String>? projectionType;

  Option<num>? rating;

  Option<String>? state;

  Option<String>? timeZone;

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
    other.rating == rating &&
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
    (rating == null ? 0 : rating!.hashCode) +
    (state == null ? 0 : state!.hashCode) +
    (timeZone == null ? 0 : timeZone!.hashCode);

  @override
  String toString() => 'ExifResponseDto[city=$city, country=$country, dateTimeOriginal=$dateTimeOriginal, description=$description, exifImageHeight=$exifImageHeight, exifImageWidth=$exifImageWidth, exposureTime=$exposureTime, fNumber=$fNumber, fileSizeInByte=$fileSizeInByte, focalLength=$focalLength, iso=$iso, latitude=$latitude, lensModel=$lensModel, longitude=$longitude, make=$make, model=$model, modifyDate=$modifyDate, orientation=$orientation, projectionType=$projectionType, rating=$rating, state=$state, timeZone=$timeZone]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.city?.isSome ?? false) {
      json[r'city'] = this.city;
    } else {
      if(this.city?.isNone ?? false) {
        json[r'city'] = null;
      }
    }
    if (this.country?.isSome ?? false) {
      json[r'country'] = this.country;
    } else {
      if(this.country?.isNone ?? false) {
        json[r'country'] = null;
      }
    }
    if (this.dateTimeOriginal?.isSome ?? false) {
      json[r'dateTimeOriginal'] = this.dateTimeOriginal!.unwrap().toUtc().toIso8601String();
    } else {
      if(this.dateTimeOriginal?.isNone ?? false) {
        json[r'dateTimeOriginal'] = null;
      }
    }
    if (this.description?.isSome ?? false) {
      json[r'description'] = this.description;
    } else {
      if(this.description?.isNone ?? false) {
        json[r'description'] = null;
      }
    }
    if (this.exifImageHeight?.isSome ?? false) {
      json[r'exifImageHeight'] = this.exifImageHeight;
    } else {
      if(this.exifImageHeight?.isNone ?? false) {
        json[r'exifImageHeight'] = null;
      }
    }
    if (this.exifImageWidth?.isSome ?? false) {
      json[r'exifImageWidth'] = this.exifImageWidth;
    } else {
      if(this.exifImageWidth?.isNone ?? false) {
        json[r'exifImageWidth'] = null;
      }
    }
    if (this.exposureTime?.isSome ?? false) {
      json[r'exposureTime'] = this.exposureTime;
    } else {
      if(this.exposureTime?.isNone ?? false) {
        json[r'exposureTime'] = null;
      }
    }
    if (this.fNumber?.isSome ?? false) {
      json[r'fNumber'] = this.fNumber;
    } else {
      if(this.fNumber?.isNone ?? false) {
        json[r'fNumber'] = null;
      }
    }
    if (this.fileSizeInByte?.isSome ?? false) {
      json[r'fileSizeInByte'] = this.fileSizeInByte;
    } else {
      if(this.fileSizeInByte?.isNone ?? false) {
        json[r'fileSizeInByte'] = null;
      }
    }
    if (this.focalLength?.isSome ?? false) {
      json[r'focalLength'] = this.focalLength;
    } else {
      if(this.focalLength?.isNone ?? false) {
        json[r'focalLength'] = null;
      }
    }
    if (this.iso?.isSome ?? false) {
      json[r'iso'] = this.iso;
    } else {
      if(this.iso?.isNone ?? false) {
        json[r'iso'] = null;
      }
    }
    if (this.latitude?.isSome ?? false) {
      json[r'latitude'] = this.latitude;
    } else {
      if(this.latitude?.isNone ?? false) {
        json[r'latitude'] = null;
      }
    }
    if (this.lensModel?.isSome ?? false) {
      json[r'lensModel'] = this.lensModel;
    } else {
      if(this.lensModel?.isNone ?? false) {
        json[r'lensModel'] = null;
      }
    }
    if (this.longitude?.isSome ?? false) {
      json[r'longitude'] = this.longitude;
    } else {
      if(this.longitude?.isNone ?? false) {
        json[r'longitude'] = null;
      }
    }
    if (this.make?.isSome ?? false) {
      json[r'make'] = this.make;
    } else {
      if(this.make?.isNone ?? false) {
        json[r'make'] = null;
      }
    }
    if (this.model?.isSome ?? false) {
      json[r'model'] = this.model;
    } else {
      if(this.model?.isNone ?? false) {
        json[r'model'] = null;
      }
    }
    if (this.modifyDate?.isSome ?? false) {
      json[r'modifyDate'] = this.modifyDate!.unwrap().toUtc().toIso8601String();
    } else {
      if(this.modifyDate?.isNone ?? false) {
        json[r'modifyDate'] = null;
      }
    }
    if (this.orientation?.isSome ?? false) {
      json[r'orientation'] = this.orientation;
    } else {
      if(this.orientation?.isNone ?? false) {
        json[r'orientation'] = null;
      }
    }
    if (this.projectionType?.isSome ?? false) {
      json[r'projectionType'] = this.projectionType;
    } else {
      if(this.projectionType?.isNone ?? false) {
        json[r'projectionType'] = null;
      }
    }
    if (this.rating?.isSome ?? false) {
      json[r'rating'] = this.rating;
    } else {
      if(this.rating?.isNone ?? false) {
        json[r'rating'] = null;
      }
    }
    if (this.state?.isSome ?? false) {
      json[r'state'] = this.state;
    } else {
      if(this.state?.isNone ?? false) {
        json[r'state'] = null;
      }
    }
    if (this.timeZone?.isSome ?? false) {
      json[r'timeZone'] = this.timeZone;
    } else {
      if(this.timeZone?.isNone ?? false) {
        json[r'timeZone'] = null;
      }
    }
    return json;
  }

  /// Returns a new [ExifResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ExifResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "ExifResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ExifResponseDto(
        city: Some.tryFrom(mapValueOfType<String>(json, r'city')),
        country: Some.tryFrom(mapValueOfType<String>(json, r'country')),
        dateTimeOriginal:  Some.tryFrom(mapDateTime(json, r'dateTimeOriginal', r'')),
        description: Some.tryFrom(mapValueOfType<String>(json, r'description')),
        exifImageHeight: Some.tryFrom(json[r'exifImageHeight'] == null
            ? null
            : num.parse('${json[r'exifImageHeight']}')),
        exifImageWidth: Some.tryFrom(json[r'exifImageWidth'] == null
            ? null
            : num.parse('${json[r'exifImageWidth']}')),
        exposureTime: Some.tryFrom(mapValueOfType<String>(json, r'exposureTime')),
        fNumber: Some.tryFrom(json[r'fNumber'] == null
            ? null
            : num.parse('${json[r'fNumber']}')),
        fileSizeInByte: Some.tryFrom(mapValueOfType<int>(json, r'fileSizeInByte')),
        focalLength: Some.tryFrom(json[r'focalLength'] == null
            ? null
            : num.parse('${json[r'focalLength']}')),
        iso: Some.tryFrom(json[r'iso'] == null
            ? null
            : num.parse('${json[r'iso']}')),
        latitude: Some.tryFrom(json[r'latitude'] == null
            ? null
            : num.parse('${json[r'latitude']}')),
        lensModel: Some.tryFrom(mapValueOfType<String>(json, r'lensModel')),
        longitude: Some.tryFrom(json[r'longitude'] == null
            ? null
            : num.parse('${json[r'longitude']}')),
        make: Some.tryFrom(mapValueOfType<String>(json, r'make')),
        model: Some.tryFrom(mapValueOfType<String>(json, r'model')),
        modifyDate:  Some.tryFrom(mapDateTime(json, r'modifyDate', r'')),
        orientation: Some.tryFrom(mapValueOfType<String>(json, r'orientation')),
        projectionType: Some.tryFrom(mapValueOfType<String>(json, r'projectionType')),
        rating: Some.tryFrom(json[r'rating'] == null
            ? null
            : num.parse('${json[r'rating']}')),
        state: Some.tryFrom(mapValueOfType<String>(json, r'state')),
        timeZone: Some.tryFrom(mapValueOfType<String>(json, r'timeZone')),
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

