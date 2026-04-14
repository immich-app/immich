//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class StatisticsSearchDto {
  /// Returns a new [StatisticsSearchDto] instance.
  StatisticsSearchDto({
    this.albumIds = const [],
    this.city,
    this.country,
    this.createdAfter,
    this.createdBefore,
    this.description,
    this.deviceId,
    this.isEncoded,
    this.isFavorite,
    this.isMotion,
    this.isNotInAlbum,
    this.isOffline,
    this.lensModel,
    this.libraryId,
    this.make,
    this.model,
    this.ocr,
    this.personIds = const [],
    this.rating,
    this.state,
    this.tagIds = const [],
    this.takenAfter,
    this.takenBefore,
    this.trashedAfter,
    this.trashedBefore,
    this.type,
    this.updatedAfter,
    this.updatedBefore,
    this.visibility,
  });

  /// Filter by album IDs
  List<String> albumIds;

  /// Filter by city name
  String? city;

  /// Filter by country name
  String? country;

  /// Filter by creation date (after)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? createdAfter;

  /// Filter by creation date (before)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? createdBefore;

  /// Filter by description text
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? description;

  /// Device ID to filter by
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? deviceId;

  /// Filter by encoded status
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isEncoded;

  /// Filter by favorite status
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isFavorite;

  /// Filter by motion photo status
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isMotion;

  /// Filter assets not in any album
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isNotInAlbum;

  /// Filter by offline status
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isOffline;

  /// Filter by lens model
  String? lensModel;

  /// Library ID to filter by
  String? libraryId;

  /// Filter by camera make
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? make;

  /// Filter by camera model
  String? model;

  /// Filter by OCR text content
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? ocr;

  /// Filter by person IDs
  List<String> personIds;

  /// Filter by rating [1-5], or null for unrated
  ///
  /// Minimum value: -1
  /// Maximum value: 5
  num? rating;

  /// Filter by state/province name
  String? state;

  /// Filter by tag IDs
  List<String>? tagIds;

  /// Filter by taken date (after)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? takenAfter;

  /// Filter by taken date (before)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? takenBefore;

  /// Filter by trash date (after)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? trashedAfter;

  /// Filter by trash date (before)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? trashedBefore;

  /// Asset type filter
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AssetTypeEnum? type;

  /// Filter by update date (after)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? updatedAfter;

  /// Filter by update date (before)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? updatedBefore;

  /// Filter by visibility
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AssetVisibility? visibility;

  @override
  bool operator ==(Object other) => identical(this, other) || other is StatisticsSearchDto &&
    _deepEquality.equals(other.albumIds, albumIds) &&
    other.city == city &&
    other.country == country &&
    other.createdAfter == createdAfter &&
    other.createdBefore == createdBefore &&
    other.description == description &&
    other.deviceId == deviceId &&
    other.isEncoded == isEncoded &&
    other.isFavorite == isFavorite &&
    other.isMotion == isMotion &&
    other.isNotInAlbum == isNotInAlbum &&
    other.isOffline == isOffline &&
    other.lensModel == lensModel &&
    other.libraryId == libraryId &&
    other.make == make &&
    other.model == model &&
    other.ocr == ocr &&
    _deepEquality.equals(other.personIds, personIds) &&
    other.rating == rating &&
    other.state == state &&
    _deepEquality.equals(other.tagIds, tagIds) &&
    other.takenAfter == takenAfter &&
    other.takenBefore == takenBefore &&
    other.trashedAfter == trashedAfter &&
    other.trashedBefore == trashedBefore &&
    other.type == type &&
    other.updatedAfter == updatedAfter &&
    other.updatedBefore == updatedBefore &&
    other.visibility == visibility;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumIds.hashCode) +
    (city == null ? 0 : city!.hashCode) +
    (country == null ? 0 : country!.hashCode) +
    (createdAfter == null ? 0 : createdAfter!.hashCode) +
    (createdBefore == null ? 0 : createdBefore!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (deviceId == null ? 0 : deviceId!.hashCode) +
    (isEncoded == null ? 0 : isEncoded!.hashCode) +
    (isFavorite == null ? 0 : isFavorite!.hashCode) +
    (isMotion == null ? 0 : isMotion!.hashCode) +
    (isNotInAlbum == null ? 0 : isNotInAlbum!.hashCode) +
    (isOffline == null ? 0 : isOffline!.hashCode) +
    (lensModel == null ? 0 : lensModel!.hashCode) +
    (libraryId == null ? 0 : libraryId!.hashCode) +
    (make == null ? 0 : make!.hashCode) +
    (model == null ? 0 : model!.hashCode) +
    (ocr == null ? 0 : ocr!.hashCode) +
    (personIds.hashCode) +
    (rating == null ? 0 : rating!.hashCode) +
    (state == null ? 0 : state!.hashCode) +
    (tagIds == null ? 0 : tagIds!.hashCode) +
    (takenAfter == null ? 0 : takenAfter!.hashCode) +
    (takenBefore == null ? 0 : takenBefore!.hashCode) +
    (trashedAfter == null ? 0 : trashedAfter!.hashCode) +
    (trashedBefore == null ? 0 : trashedBefore!.hashCode) +
    (type == null ? 0 : type!.hashCode) +
    (updatedAfter == null ? 0 : updatedAfter!.hashCode) +
    (updatedBefore == null ? 0 : updatedBefore!.hashCode) +
    (visibility == null ? 0 : visibility!.hashCode);

  @override
  String toString() => 'StatisticsSearchDto[albumIds=$albumIds, city=$city, country=$country, createdAfter=$createdAfter, createdBefore=$createdBefore, description=$description, deviceId=$deviceId, isEncoded=$isEncoded, isFavorite=$isFavorite, isMotion=$isMotion, isNotInAlbum=$isNotInAlbum, isOffline=$isOffline, lensModel=$lensModel, libraryId=$libraryId, make=$make, model=$model, ocr=$ocr, personIds=$personIds, rating=$rating, state=$state, tagIds=$tagIds, takenAfter=$takenAfter, takenBefore=$takenBefore, trashedAfter=$trashedAfter, trashedBefore=$trashedBefore, type=$type, updatedAfter=$updatedAfter, updatedBefore=$updatedBefore, visibility=$visibility]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albumIds'] = this.albumIds;
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
    if (this.createdAfter != null) {
      json[r'createdAfter'] = this.createdAfter!.toUtc().toIso8601String();
    } else {
    //  json[r'createdAfter'] = null;
    }
    if (this.createdBefore != null) {
      json[r'createdBefore'] = this.createdBefore!.toUtc().toIso8601String();
    } else {
    //  json[r'createdBefore'] = null;
    }
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
    if (this.deviceId != null) {
      json[r'deviceId'] = this.deviceId;
    } else {
    //  json[r'deviceId'] = null;
    }
    if (this.isEncoded != null) {
      json[r'isEncoded'] = this.isEncoded;
    } else {
    //  json[r'isEncoded'] = null;
    }
    if (this.isFavorite != null) {
      json[r'isFavorite'] = this.isFavorite;
    } else {
    //  json[r'isFavorite'] = null;
    }
    if (this.isMotion != null) {
      json[r'isMotion'] = this.isMotion;
    } else {
    //  json[r'isMotion'] = null;
    }
    if (this.isNotInAlbum != null) {
      json[r'isNotInAlbum'] = this.isNotInAlbum;
    } else {
    //  json[r'isNotInAlbum'] = null;
    }
    if (this.isOffline != null) {
      json[r'isOffline'] = this.isOffline;
    } else {
    //  json[r'isOffline'] = null;
    }
    if (this.lensModel != null) {
      json[r'lensModel'] = this.lensModel;
    } else {
    //  json[r'lensModel'] = null;
    }
    if (this.libraryId != null) {
      json[r'libraryId'] = this.libraryId;
    } else {
    //  json[r'libraryId'] = null;
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
    if (this.ocr != null) {
      json[r'ocr'] = this.ocr;
    } else {
    //  json[r'ocr'] = null;
    }
      json[r'personIds'] = this.personIds;
    if (this.rating != null) {
      json[r'rating'] = this.rating;
    } else {
    //  json[r'rating'] = null;
    }
    if (this.state != null) {
      json[r'state'] = this.state;
    } else {
    //  json[r'state'] = null;
    }
    if (this.tagIds != null) {
      json[r'tagIds'] = this.tagIds;
    } else {
    //  json[r'tagIds'] = null;
    }
    if (this.takenAfter != null) {
      json[r'takenAfter'] = this.takenAfter!.toUtc().toIso8601String();
    } else {
    //  json[r'takenAfter'] = null;
    }
    if (this.takenBefore != null) {
      json[r'takenBefore'] = this.takenBefore!.toUtc().toIso8601String();
    } else {
    //  json[r'takenBefore'] = null;
    }
    if (this.trashedAfter != null) {
      json[r'trashedAfter'] = this.trashedAfter!.toUtc().toIso8601String();
    } else {
    //  json[r'trashedAfter'] = null;
    }
    if (this.trashedBefore != null) {
      json[r'trashedBefore'] = this.trashedBefore!.toUtc().toIso8601String();
    } else {
    //  json[r'trashedBefore'] = null;
    }
    if (this.type != null) {
      json[r'type'] = this.type;
    } else {
    //  json[r'type'] = null;
    }
    if (this.updatedAfter != null) {
      json[r'updatedAfter'] = this.updatedAfter!.toUtc().toIso8601String();
    } else {
    //  json[r'updatedAfter'] = null;
    }
    if (this.updatedBefore != null) {
      json[r'updatedBefore'] = this.updatedBefore!.toUtc().toIso8601String();
    } else {
    //  json[r'updatedBefore'] = null;
    }
    if (this.visibility != null) {
      json[r'visibility'] = this.visibility;
    } else {
    //  json[r'visibility'] = null;
    }
    return json;
  }

  /// Returns a new [StatisticsSearchDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static StatisticsSearchDto? fromJson(dynamic value) {
    upgradeDto(value, "StatisticsSearchDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return StatisticsSearchDto(
        albumIds: json[r'albumIds'] is Iterable
            ? (json[r'albumIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        city: mapValueOfType<String>(json, r'city'),
        country: mapValueOfType<String>(json, r'country'),
        createdAfter: mapDateTime(json, r'createdAfter', r''),
        createdBefore: mapDateTime(json, r'createdBefore', r''),
        description: mapValueOfType<String>(json, r'description'),
        deviceId: mapValueOfType<String>(json, r'deviceId'),
        isEncoded: mapValueOfType<bool>(json, r'isEncoded'),
        isFavorite: mapValueOfType<bool>(json, r'isFavorite'),
        isMotion: mapValueOfType<bool>(json, r'isMotion'),
        isNotInAlbum: mapValueOfType<bool>(json, r'isNotInAlbum'),
        isOffline: mapValueOfType<bool>(json, r'isOffline'),
        lensModel: mapValueOfType<String>(json, r'lensModel'),
        libraryId: mapValueOfType<String>(json, r'libraryId'),
        make: mapValueOfType<String>(json, r'make'),
        model: mapValueOfType<String>(json, r'model'),
        ocr: mapValueOfType<String>(json, r'ocr'),
        personIds: json[r'personIds'] is Iterable
            ? (json[r'personIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        rating: json[r'rating'] == null
            ? null
            : num.parse('${json[r'rating']}'),
        state: mapValueOfType<String>(json, r'state'),
        tagIds: json[r'tagIds'] is Iterable
            ? (json[r'tagIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        takenAfter: mapDateTime(json, r'takenAfter', r''),
        takenBefore: mapDateTime(json, r'takenBefore', r''),
        trashedAfter: mapDateTime(json, r'trashedAfter', r''),
        trashedBefore: mapDateTime(json, r'trashedBefore', r''),
        type: AssetTypeEnum.fromJson(json[r'type']),
        updatedAfter: mapDateTime(json, r'updatedAfter', r''),
        updatedBefore: mapDateTime(json, r'updatedBefore', r''),
        visibility: AssetVisibility.fromJson(json[r'visibility']),
      );
    }
    return null;
  }

  static List<StatisticsSearchDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <StatisticsSearchDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = StatisticsSearchDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, StatisticsSearchDto> mapFromJson(dynamic json) {
    final map = <String, StatisticsSearchDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = StatisticsSearchDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of StatisticsSearchDto-objects as value to a dart map
  static Map<String, List<StatisticsSearchDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<StatisticsSearchDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = StatisticsSearchDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

