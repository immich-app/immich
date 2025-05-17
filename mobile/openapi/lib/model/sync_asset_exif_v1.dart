//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncAssetExifV1 {
  /// Returns a new [SyncAssetExifV1] instance.
  SyncAssetExifV1({
    required this.assetId,
    required this.city,
    required this.country,
    required this.dateTimeOriginal,
    required this.description,
    required this.exifImageHeight,
    required this.exifImageWidth,
    required this.exposureTime,
    required this.fNumber,
    required this.fileSizeInByte,
    required this.focalLength,
    required this.fps,
    required this.iso,
    required this.latitude,
    required this.lensModel,
    required this.longitude,
    required this.make,
    required this.model,
    required this.modifyDate,
    required this.orientation,
    required this.profileDescription,
    required this.projectionType,
    required this.rating,
    required this.state,
    required this.timeZone,
  });

  String assetId;

  Option<String>? city;

  Option<String>? country;

  Option<DateTime>? dateTimeOriginal;

  Option<String>? description;

  Option<int>? exifImageHeight;

  Option<int>? exifImageWidth;

  Option<String>? exposureTime;

  Option<int>? fNumber;

  Option<int>? fileSizeInByte;

  Option<int>? focalLength;

  Option<int>? fps;

  Option<int>? iso;

  Option<int>? latitude;

  Option<String>? lensModel;

  Option<int>? longitude;

  Option<String>? make;

  Option<String>? model;

  Option<DateTime>? modifyDate;

  Option<String>? orientation;

  Option<String>? profileDescription;

  Option<String>? projectionType;

  Option<int>? rating;

  Option<String>? state;

  Option<String>? timeZone;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncAssetExifV1 &&
    other.assetId == assetId &&
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
    other.fps == fps &&
    other.iso == iso &&
    other.latitude == latitude &&
    other.lensModel == lensModel &&
    other.longitude == longitude &&
    other.make == make &&
    other.model == model &&
    other.modifyDate == modifyDate &&
    other.orientation == orientation &&
    other.profileDescription == profileDescription &&
    other.projectionType == projectionType &&
    other.rating == rating &&
    other.state == state &&
    other.timeZone == timeZone;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetId.hashCode) +
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
    (fps == null ? 0 : fps!.hashCode) +
    (iso == null ? 0 : iso!.hashCode) +
    (latitude == null ? 0 : latitude!.hashCode) +
    (lensModel == null ? 0 : lensModel!.hashCode) +
    (longitude == null ? 0 : longitude!.hashCode) +
    (make == null ? 0 : make!.hashCode) +
    (model == null ? 0 : model!.hashCode) +
    (modifyDate == null ? 0 : modifyDate!.hashCode) +
    (orientation == null ? 0 : orientation!.hashCode) +
    (profileDescription == null ? 0 : profileDescription!.hashCode) +
    (projectionType == null ? 0 : projectionType!.hashCode) +
    (rating == null ? 0 : rating!.hashCode) +
    (state == null ? 0 : state!.hashCode) +
    (timeZone == null ? 0 : timeZone!.hashCode);

  @override
  String toString() => 'SyncAssetExifV1[assetId=$assetId, city=$city, country=$country, dateTimeOriginal=$dateTimeOriginal, description=$description, exifImageHeight=$exifImageHeight, exifImageWidth=$exifImageWidth, exposureTime=$exposureTime, fNumber=$fNumber, fileSizeInByte=$fileSizeInByte, focalLength=$focalLength, fps=$fps, iso=$iso, latitude=$latitude, lensModel=$lensModel, longitude=$longitude, make=$make, model=$model, modifyDate=$modifyDate, orientation=$orientation, profileDescription=$profileDescription, projectionType=$projectionType, rating=$rating, state=$state, timeZone=$timeZone]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetId'] = this.assetId;
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
    if (this.fps?.isSome ?? false) {
      json[r'fps'] = this.fps;
    } else {
      if(this.fps?.isNone ?? false) {
        json[r'fps'] = null;
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
    if (this.profileDescription?.isSome ?? false) {
      json[r'profileDescription'] = this.profileDescription;
    } else {
      if(this.profileDescription?.isNone ?? false) {
        json[r'profileDescription'] = null;
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

  /// Returns a new [SyncAssetExifV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncAssetExifV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncAssetExifV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncAssetExifV1(
        assetId: mapValueOfType<String>(json, r'assetId')!,
        city: Option.from(mapValueOfType<String>(json, r'city')),
        country: Option.from(mapValueOfType<String>(json, r'country')),
        dateTimeOriginal:  Option.from(mapDateTime(json, r'dateTimeOriginal', r'')),
        description: Option.from(mapValueOfType<String>(json, r'description')),
        exifImageHeight: Option.from(mapValueOfType<int>(json, r'exifImageHeight')),
        exifImageWidth: Option.from(mapValueOfType<int>(json, r'exifImageWidth')),
        exposureTime: Option.from(mapValueOfType<String>(json, r'exposureTime')),
        fNumber: Option.from(mapValueOfType<int>(json, r'fNumber')),
        fileSizeInByte: Option.from(mapValueOfType<int>(json, r'fileSizeInByte')),
        focalLength: Option.from(mapValueOfType<int>(json, r'focalLength')),
        fps: Option.from(mapValueOfType<int>(json, r'fps')),
        iso: Option.from(mapValueOfType<int>(json, r'iso')),
        latitude: Option.from(mapValueOfType<int>(json, r'latitude')),
        lensModel: Option.from(mapValueOfType<String>(json, r'lensModel')),
        longitude: Option.from(mapValueOfType<int>(json, r'longitude')),
        make: Option.from(mapValueOfType<String>(json, r'make')),
        model: Option.from(mapValueOfType<String>(json, r'model')),
        modifyDate:  Option.from(mapDateTime(json, r'modifyDate', r'')),
        orientation: Option.from(mapValueOfType<String>(json, r'orientation')),
        profileDescription: Option.from(mapValueOfType<String>(json, r'profileDescription')),
        projectionType: Option.from(mapValueOfType<String>(json, r'projectionType')),
        rating: Option.from(mapValueOfType<int>(json, r'rating')),
        state: Option.from(mapValueOfType<String>(json, r'state')),
        timeZone: Option.from(mapValueOfType<String>(json, r'timeZone')),
      );
    }
    return null;
  }

  static List<SyncAssetExifV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncAssetExifV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncAssetExifV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncAssetExifV1> mapFromJson(dynamic json) {
    final map = <String, SyncAssetExifV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncAssetExifV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncAssetExifV1-objects as value to a dart map
  static Map<String, List<SyncAssetExifV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncAssetExifV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncAssetExifV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetId',
    'city',
    'country',
    'dateTimeOriginal',
    'description',
    'exifImageHeight',
    'exifImageWidth',
    'exposureTime',
    'fNumber',
    'fileSizeInByte',
    'focalLength',
    'fps',
    'iso',
    'latitude',
    'lensModel',
    'longitude',
    'make',
    'model',
    'modifyDate',
    'orientation',
    'profileDescription',
    'projectionType',
    'rating',
    'state',
    'timeZone',
  };
}

