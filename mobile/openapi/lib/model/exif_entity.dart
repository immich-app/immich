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
    this.asset,
    required this.assetId,
    required this.city,
    required this.country,
    required this.dateTimeOriginal,
    required this.description,
    required this.exifImageHeight,
    required this.exifImageWidth,
    required this.exifTextSearchableColumn,
    required this.exposureTime,
    required this.fNumber,
    required this.fileSizeInByte,
    required this.focalLength,
    this.fps,
    required this.iso,
    required this.latitude,
    required this.lensModel,
    required this.livePhotoCID,
    required this.longitude,
    required this.make,
    required this.model,
    required this.modifyDate,
    required this.orientation,
    required this.projectionType,
    required this.state,
    required this.timeZone,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AssetEntity? asset;

  String assetId;

  String? city;

  String? country;

  DateTime? dateTimeOriginal;

  /// General info
  String description;

  num? exifImageHeight;

  num? exifImageWidth;

  String exifTextSearchableColumn;

  String? exposureTime;

  num? fNumber;

  num? fileSizeInByte;

  num? focalLength;

  /// Video info
  num? fps;

  num? iso;

  num? latitude;

  String? lensModel;

  String? livePhotoCID;

  num? longitude;

  /// Image info
  String? make;

  String? model;

  DateTime? modifyDate;

  String? orientation;

  String? projectionType;

  String? state;

  String? timeZone;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ExifEntity &&
     other.asset == asset &&
     other.assetId == assetId &&
     other.city == city &&
     other.country == country &&
     other.dateTimeOriginal == dateTimeOriginal &&
     other.description == description &&
     other.exifImageHeight == exifImageHeight &&
     other.exifImageWidth == exifImageWidth &&
     other.exifTextSearchableColumn == exifTextSearchableColumn &&
     other.exposureTime == exposureTime &&
     other.fNumber == fNumber &&
     other.fileSizeInByte == fileSizeInByte &&
     other.focalLength == focalLength &&
     other.fps == fps &&
     other.iso == iso &&
     other.latitude == latitude &&
     other.lensModel == lensModel &&
     other.livePhotoCID == livePhotoCID &&
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
    (asset == null ? 0 : asset!.hashCode) +
    (assetId.hashCode) +
    (city == null ? 0 : city!.hashCode) +
    (country == null ? 0 : country!.hashCode) +
    (dateTimeOriginal == null ? 0 : dateTimeOriginal!.hashCode) +
    (description.hashCode) +
    (exifImageHeight == null ? 0 : exifImageHeight!.hashCode) +
    (exifImageWidth == null ? 0 : exifImageWidth!.hashCode) +
    (exifTextSearchableColumn.hashCode) +
    (exposureTime == null ? 0 : exposureTime!.hashCode) +
    (fNumber == null ? 0 : fNumber!.hashCode) +
    (fileSizeInByte == null ? 0 : fileSizeInByte!.hashCode) +
    (focalLength == null ? 0 : focalLength!.hashCode) +
    (fps == null ? 0 : fps!.hashCode) +
    (iso == null ? 0 : iso!.hashCode) +
    (latitude == null ? 0 : latitude!.hashCode) +
    (lensModel == null ? 0 : lensModel!.hashCode) +
    (livePhotoCID == null ? 0 : livePhotoCID!.hashCode) +
    (longitude == null ? 0 : longitude!.hashCode) +
    (make == null ? 0 : make!.hashCode) +
    (model == null ? 0 : model!.hashCode) +
    (modifyDate == null ? 0 : modifyDate!.hashCode) +
    (orientation == null ? 0 : orientation!.hashCode) +
    (projectionType == null ? 0 : projectionType!.hashCode) +
    (state == null ? 0 : state!.hashCode) +
    (timeZone == null ? 0 : timeZone!.hashCode);

  @override
  String toString() => 'ExifEntity[asset=$asset, assetId=$assetId, city=$city, country=$country, dateTimeOriginal=$dateTimeOriginal, description=$description, exifImageHeight=$exifImageHeight, exifImageWidth=$exifImageWidth, exifTextSearchableColumn=$exifTextSearchableColumn, exposureTime=$exposureTime, fNumber=$fNumber, fileSizeInByte=$fileSizeInByte, focalLength=$focalLength, fps=$fps, iso=$iso, latitude=$latitude, lensModel=$lensModel, livePhotoCID=$livePhotoCID, longitude=$longitude, make=$make, model=$model, modifyDate=$modifyDate, orientation=$orientation, projectionType=$projectionType, state=$state, timeZone=$timeZone]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.asset != null) {
      json[r'asset'] = this.asset;
    } else {
    //  json[r'asset'] = null;
    }
      json[r'assetId'] = this.assetId;
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
      json[r'description'] = this.description;
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
      json[r'exifTextSearchableColumn'] = this.exifTextSearchableColumn;
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
    if (this.fps != null) {
      json[r'fps'] = this.fps;
    } else {
    //  json[r'fps'] = null;
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
    if (this.livePhotoCID != null) {
      json[r'livePhotoCID'] = this.livePhotoCID;
    } else {
    //  json[r'livePhotoCID'] = null;
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

  /// Returns a new [ExifEntity] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ExifEntity? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ExifEntity(
        asset: AssetEntity.fromJson(json[r'asset']),
        assetId: mapValueOfType<String>(json, r'assetId')!,
        city: mapValueOfType<String>(json, r'city'),
        country: mapValueOfType<String>(json, r'country'),
        dateTimeOriginal: mapDateTime(json, r'dateTimeOriginal', ''),
        description: mapValueOfType<String>(json, r'description')!,
        exifImageHeight: json[r'exifImageHeight'] == null
            ? null
            : num.parse(json[r'exifImageHeight'].toString()),
        exifImageWidth: json[r'exifImageWidth'] == null
            ? null
            : num.parse(json[r'exifImageWidth'].toString()),
        exifTextSearchableColumn: mapValueOfType<String>(json, r'exifTextSearchableColumn')!,
        exposureTime: mapValueOfType<String>(json, r'exposureTime'),
        fNumber: json[r'fNumber'] == null
            ? null
            : num.parse(json[r'fNumber'].toString()),
        fileSizeInByte: json[r'fileSizeInByte'] == null
            ? null
            : num.parse(json[r'fileSizeInByte'].toString()),
        focalLength: json[r'focalLength'] == null
            ? null
            : num.parse(json[r'focalLength'].toString()),
        fps: json[r'fps'] == null
            ? null
            : num.parse(json[r'fps'].toString()),
        iso: json[r'iso'] == null
            ? null
            : num.parse(json[r'iso'].toString()),
        latitude: json[r'latitude'] == null
            ? null
            : num.parse(json[r'latitude'].toString()),
        lensModel: mapValueOfType<String>(json, r'lensModel'),
        livePhotoCID: mapValueOfType<String>(json, r'livePhotoCID'),
        longitude: json[r'longitude'] == null
            ? null
            : num.parse(json[r'longitude'].toString()),
        make: mapValueOfType<String>(json, r'make'),
        model: mapValueOfType<String>(json, r'model'),
        modifyDate: mapDateTime(json, r'modifyDate', ''),
        orientation: mapValueOfType<String>(json, r'orientation'),
        projectionType: mapValueOfType<String>(json, r'projectionType'),
        state: mapValueOfType<String>(json, r'state'),
        timeZone: mapValueOfType<String>(json, r'timeZone'),
      );
    }
    return null;
  }

  static List<ExifEntity> listFromJson(dynamic json, {bool growable = false,}) {
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
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ExifEntity.listFromJson(entry.value, growable: growable,);
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
    'exifTextSearchableColumn',
    'exposureTime',
    'fNumber',
    'fileSizeInByte',
    'focalLength',
    'iso',
    'latitude',
    'lensModel',
    'livePhotoCID',
    'longitude',
    'make',
    'model',
    'modifyDate',
    'orientation',
    'projectionType',
    'state',
    'timeZone',
  };
}

