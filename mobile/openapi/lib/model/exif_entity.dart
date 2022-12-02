//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ExifEntity {
  /// Returns a new [ExifEntity] instance.
  ExifEntity({
    required this.id,
    required this.assetId,
    required this.description,
    required this.exifImageWidth,
    required this.exifImageHeight,
    required this.fileSizeInByte,
    required this.orientation,
    required this.dateTimeOriginal,
    required this.modifyDate,
    required this.latitude,
    required this.longitude,
    required this.city,
    required this.state,
    required this.country,
    required this.make,
    required this.model,
    required this.imageName,
    required this.lensModel,
    required this.fNumber,
    required this.focalLength,
    required this.iso,
    required this.exposureTime,
    this.fps,
    this.asset,
    required this.exifTextSearchableColumn,
  });

  String id;

  String assetId;

  /// General info
  String description;

  num? exifImageWidth;

  num? exifImageHeight;

  num? fileSizeInByte;

  String? orientation;

  DateTime? dateTimeOriginal;

  DateTime? modifyDate;

  num? latitude;

  num? longitude;

  String? city;

  String? state;

  String? country;

  /// Image info
  String? make;

  String? model;

  String? imageName;

  String? lensModel;

  num? fNumber;

  num? focalLength;

  num? iso;

  num? exposureTime;

  /// Video info
  num? fps;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AssetEntity? asset;

  String exifTextSearchableColumn;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ExifEntity &&
     other.id == id &&
     other.assetId == assetId &&
     other.description == description &&
     other.exifImageWidth == exifImageWidth &&
     other.exifImageHeight == exifImageHeight &&
     other.fileSizeInByte == fileSizeInByte &&
     other.orientation == orientation &&
     other.dateTimeOriginal == dateTimeOriginal &&
     other.modifyDate == modifyDate &&
     other.latitude == latitude &&
     other.longitude == longitude &&
     other.city == city &&
     other.state == state &&
     other.country == country &&
     other.make == make &&
     other.model == model &&
     other.imageName == imageName &&
     other.lensModel == lensModel &&
     other.fNumber == fNumber &&
     other.focalLength == focalLength &&
     other.iso == iso &&
     other.exposureTime == exposureTime &&
     other.fps == fps &&
     other.asset == asset &&
     other.exifTextSearchableColumn == exifTextSearchableColumn;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (assetId.hashCode) +
    (description.hashCode) +
    (exifImageWidth == null ? 0 : exifImageWidth!.hashCode) +
    (exifImageHeight == null ? 0 : exifImageHeight!.hashCode) +
    (fileSizeInByte == null ? 0 : fileSizeInByte!.hashCode) +
    (orientation == null ? 0 : orientation!.hashCode) +
    (dateTimeOriginal == null ? 0 : dateTimeOriginal!.hashCode) +
    (modifyDate == null ? 0 : modifyDate!.hashCode) +
    (latitude == null ? 0 : latitude!.hashCode) +
    (longitude == null ? 0 : longitude!.hashCode) +
    (city == null ? 0 : city!.hashCode) +
    (state == null ? 0 : state!.hashCode) +
    (country == null ? 0 : country!.hashCode) +
    (make == null ? 0 : make!.hashCode) +
    (model == null ? 0 : model!.hashCode) +
    (imageName == null ? 0 : imageName!.hashCode) +
    (lensModel == null ? 0 : lensModel!.hashCode) +
    (fNumber == null ? 0 : fNumber!.hashCode) +
    (focalLength == null ? 0 : focalLength!.hashCode) +
    (iso == null ? 0 : iso!.hashCode) +
    (exposureTime == null ? 0 : exposureTime!.hashCode) +
    (fps == null ? 0 : fps!.hashCode) +
    (asset == null ? 0 : asset!.hashCode) +
    (exifTextSearchableColumn.hashCode);

  @override
  String toString() => 'ExifEntity[id=$id, assetId=$assetId, description=$description, exifImageWidth=$exifImageWidth, exifImageHeight=$exifImageHeight, fileSizeInByte=$fileSizeInByte, orientation=$orientation, dateTimeOriginal=$dateTimeOriginal, modifyDate=$modifyDate, latitude=$latitude, longitude=$longitude, city=$city, state=$state, country=$country, make=$make, model=$model, imageName=$imageName, lensModel=$lensModel, fNumber=$fNumber, focalLength=$focalLength, iso=$iso, exposureTime=$exposureTime, fps=$fps, asset=$asset, exifTextSearchableColumn=$exifTextSearchableColumn]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'id'] = id;
      _json[r'assetId'] = assetId;
      _json[r'description'] = description;
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
    if (fileSizeInByte != null) {
      _json[r'fileSizeInByte'] = fileSizeInByte;
    } else {
      _json[r'fileSizeInByte'] = null;
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
    if (fps != null) {
      _json[r'fps'] = fps;
    } else {
      _json[r'fps'] = null;
    }
    if (asset != null) {
      _json[r'asset'] = asset;
    } else {
      _json[r'asset'] = null;
    }
      _json[r'exifTextSearchableColumn'] = exifTextSearchableColumn;
    return _json;
  }

  /// Returns a new [ExifEntity] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ExifEntity? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "ExifEntity[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "ExifEntity[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return ExifEntity(
        id: mapValueOfType<String>(json, r'id')!,
        assetId: mapValueOfType<String>(json, r'assetId')!,
        description: mapValueOfType<String>(json, r'description')!,
        exifImageWidth: json[r'exifImageWidth'] == null
            ? null
            : num.parse(json[r'exifImageWidth'].toString()),
        exifImageHeight: json[r'exifImageHeight'] == null
            ? null
            : num.parse(json[r'exifImageHeight'].toString()),
        fileSizeInByte: json[r'fileSizeInByte'] == null
            ? null
            : num.parse(json[r'fileSizeInByte'].toString()),
        orientation: mapValueOfType<String>(json, r'orientation'),
        dateTimeOriginal: mapDateTime(json, r'dateTimeOriginal', ''),
        modifyDate: mapDateTime(json, r'modifyDate', ''),
        latitude: json[r'latitude'] == null
            ? null
            : num.parse(json[r'latitude'].toString()),
        longitude: json[r'longitude'] == null
            ? null
            : num.parse(json[r'longitude'].toString()),
        city: mapValueOfType<String>(json, r'city'),
        state: mapValueOfType<String>(json, r'state'),
        country: mapValueOfType<String>(json, r'country'),
        make: mapValueOfType<String>(json, r'make'),
        model: mapValueOfType<String>(json, r'model'),
        imageName: mapValueOfType<String>(json, r'imageName'),
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
        fps: json[r'fps'] == null
            ? null
            : num.parse(json[r'fps'].toString()),
        asset: AssetEntity.fromJson(json[r'asset']),
        exifTextSearchableColumn: mapValueOfType<String>(json, r'exifTextSearchableColumn')!,
      );
    }
    return null;
  }

  static List<ExifEntity>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ExifEntity>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ExifEntity.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ExifEntity> mapFromJson(dynamic json) {
    final map = <String, ExifEntity>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ExifEntity.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ExifEntity-objects as value to a dart map
  static Map<String, List<ExifEntity>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ExifEntity>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ExifEntity.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'assetId',
    'description',
    'exifImageWidth',
    'exifImageHeight',
    'fileSizeInByte',
    'orientation',
    'dateTimeOriginal',
    'modifyDate',
    'latitude',
    'longitude',
    'city',
    'state',
    'country',
    'make',
    'model',
    'imageName',
    'lensModel',
    'fNumber',
    'focalLength',
    'iso',
    'exposureTime',
    'exifTextSearchableColumn',
  };
}

