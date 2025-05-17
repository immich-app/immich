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
    this.city = const None(),
    this.country = const None(),
    this.dateTimeOriginal = const None(),
    this.description = const None(),
    this.exifImageHeight = const None(),
    this.exifImageWidth = const None(),
    this.exposureTime = const None(),
    this.fNumber = const None(),
    this.fileSizeInByte = const None(),
    this.focalLength = const None(),
    this.fps = const None(),
    this.iso = const None(),
    this.latitude = const None(),
    this.lensModel = const None(),
    this.longitude = const None(),
    this.make = const None(),
    this.model = const None(),
    this.modifyDate = const None(),
    this.orientation = const None(),
    this.profileDescription = const None(),
    this.projectionType = const None(),
    this.rating = const None(),
    this.state = const None(),
    this.timeZone = const None(),
  });

  String assetId;

  Option<String> city;

  Option<String> country;

  Option<DateTime> dateTimeOriginal;

  Option<String> description;

  Option<int> exifImageHeight;

  Option<int> exifImageWidth;

  Option<String> exposureTime;

  Option<int> fNumber;

  Option<int> fileSizeInByte;

  Option<int> focalLength;

  Option<int> fps;

  Option<int> iso;

  Option<int> latitude;

  Option<String> lensModel;

  Option<int> longitude;

  Option<String> make;

  Option<String> model;

  Option<DateTime> modifyDate;

  Option<String> orientation;

  Option<String> profileDescription;

  Option<String> projectionType;

  Option<int> rating;

  Option<String> state;

  Option<String> timeZone;

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
    (city.hashCode) +
    (country.hashCode) +
    (dateTimeOriginal.hashCode) +
    (description.hashCode) +
    (exifImageHeight.hashCode) +
    (exifImageWidth.hashCode) +
    (exposureTime.hashCode) +
    (fNumber.hashCode) +
    (fileSizeInByte.hashCode) +
    (focalLength.hashCode) +
    (fps.hashCode) +
    (iso.hashCode) +
    (latitude.hashCode) +
    (lensModel.hashCode) +
    (longitude.hashCode) +
    (make.hashCode) +
    (model.hashCode) +
    (modifyDate.hashCode) +
    (orientation.hashCode) +
    (profileDescription.hashCode) +
    (projectionType.hashCode) +
    (rating.hashCode) +
    (state.hashCode) +
    (timeZone.hashCode);

  @override
  String toString() => 'SyncAssetExifV1[assetId=$assetId, city=$city, country=$country, dateTimeOriginal=$dateTimeOriginal, description=$description, exifImageHeight=$exifImageHeight, exifImageWidth=$exifImageWidth, exposureTime=$exposureTime, fNumber=$fNumber, fileSizeInByte=$fileSizeInByte, focalLength=$focalLength, fps=$fps, iso=$iso, latitude=$latitude, lensModel=$lensModel, longitude=$longitude, make=$make, model=$model, modifyDate=$modifyDate, orientation=$orientation, profileDescription=$profileDescription, projectionType=$projectionType, rating=$rating, state=$state, timeZone=$timeZone]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetId'] = this.assetId;
    if (this.city.unwrapOrNull() != null) {
      json[r'city'] = this.city;
    } else {
      if(this.city.isSome) {
        json[r'city'] = null;
      }
    }
    if (this.country.unwrapOrNull() != null) {
      json[r'country'] = this.country;
    } else {
      if(this.country.isSome) {
        json[r'country'] = null;
      }
    }
    if (this.dateTimeOriginal.unwrapOrNull() != null) {
      json[r'dateTimeOriginal'] = this.dateTimeOriginal.unwrap().toUtc().toIso8601String();
    } else {
      if(this.dateTimeOriginal.isSome) {
        json[r'dateTimeOriginal'] = null;
      }
    }
    if (this.description.unwrapOrNull() != null) {
      json[r'description'] = this.description;
    } else {
      if(this.description.isSome) {
        json[r'description'] = null;
      }
    }
    if (this.exifImageHeight.unwrapOrNull() != null) {
      json[r'exifImageHeight'] = this.exifImageHeight;
    } else {
      if(this.exifImageHeight.isSome) {
        json[r'exifImageHeight'] = null;
      }
    }
    if (this.exifImageWidth.unwrapOrNull() != null) {
      json[r'exifImageWidth'] = this.exifImageWidth;
    } else {
      if(this.exifImageWidth.isSome) {
        json[r'exifImageWidth'] = null;
      }
    }
    if (this.exposureTime.unwrapOrNull() != null) {
      json[r'exposureTime'] = this.exposureTime;
    } else {
      if(this.exposureTime.isSome) {
        json[r'exposureTime'] = null;
      }
    }
    if (this.fNumber.unwrapOrNull() != null) {
      json[r'fNumber'] = this.fNumber;
    } else {
      if(this.fNumber.isSome) {
        json[r'fNumber'] = null;
      }
    }
    if (this.fileSizeInByte.unwrapOrNull() != null) {
      json[r'fileSizeInByte'] = this.fileSizeInByte;
    } else {
      if(this.fileSizeInByte.isSome) {
        json[r'fileSizeInByte'] = null;
      }
    }
    if (this.focalLength.unwrapOrNull() != null) {
      json[r'focalLength'] = this.focalLength;
    } else {
      if(this.focalLength.isSome) {
        json[r'focalLength'] = null;
      }
    }
    if (this.fps.unwrapOrNull() != null) {
      json[r'fps'] = this.fps;
    } else {
      if(this.fps.isSome) {
        json[r'fps'] = null;
      }
    }
    if (this.iso.unwrapOrNull() != null) {
      json[r'iso'] = this.iso;
    } else {
      if(this.iso.isSome) {
        json[r'iso'] = null;
      }
    }
    if (this.latitude.unwrapOrNull() != null) {
      json[r'latitude'] = this.latitude;
    } else {
      if(this.latitude.isSome) {
        json[r'latitude'] = null;
      }
    }
    if (this.lensModel.unwrapOrNull() != null) {
      json[r'lensModel'] = this.lensModel;
    } else {
      if(this.lensModel.isSome) {
        json[r'lensModel'] = null;
      }
    }
    if (this.longitude.unwrapOrNull() != null) {
      json[r'longitude'] = this.longitude;
    } else {
      if(this.longitude.isSome) {
        json[r'longitude'] = null;
      }
    }
    if (this.make.unwrapOrNull() != null) {
      json[r'make'] = this.make;
    } else {
      if(this.make.isSome) {
        json[r'make'] = null;
      }
    }
    if (this.model.unwrapOrNull() != null) {
      json[r'model'] = this.model;
    } else {
      if(this.model.isSome) {
        json[r'model'] = null;
      }
    }
    if (this.modifyDate.unwrapOrNull() != null) {
      json[r'modifyDate'] = this.modifyDate.unwrap().toUtc().toIso8601String();
    } else {
      if(this.modifyDate.isSome) {
        json[r'modifyDate'] = null;
      }
    }
    if (this.orientation.unwrapOrNull() != null) {
      json[r'orientation'] = this.orientation;
    } else {
      if(this.orientation.isSome) {
        json[r'orientation'] = null;
      }
    }
    if (this.profileDescription.unwrapOrNull() != null) {
      json[r'profileDescription'] = this.profileDescription;
    } else {
      if(this.profileDescription.isSome) {
        json[r'profileDescription'] = null;
      }
    }
    if (this.projectionType.unwrapOrNull() != null) {
      json[r'projectionType'] = this.projectionType;
    } else {
      if(this.projectionType.isSome) {
        json[r'projectionType'] = null;
      }
    }
    if (this.rating.unwrapOrNull() != null) {
      json[r'rating'] = this.rating;
    } else {
      if(this.rating.isSome) {
        json[r'rating'] = null;
      }
    }
    if (this.state.unwrapOrNull() != null) {
      json[r'state'] = this.state;
    } else {
      if(this.state.isSome) {
        json[r'state'] = null;
      }
    }
    if (this.timeZone.unwrapOrNull() != null) {
      json[r'timeZone'] = this.timeZone;
    } else {
      if(this.timeZone.isSome) {
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

