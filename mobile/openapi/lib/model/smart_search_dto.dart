//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SmartSearchDto {
  /// Returns a new [SmartSearchDto] instance.
  SmartSearchDto({
    this.city,
    this.country,
    this.createdAfter,
    this.createdBefore,
    this.deviceId,
    this.isArchived,
    this.isEncoded,
    this.isFavorite,
    this.isMotion,
    this.isNotInAlbum,
    this.isOffline,
    this.isVisible,
    this.lensModel,
    this.libraryId,
    this.make,
    this.model,
    this.page,
    this.personIds = const [],
    required this.query,
    this.size,
    this.state,
    this.takenAfter,
    this.takenBefore,
    this.trashedAfter,
    this.trashedBefore,
    this.type,
    this.updatedAfter,
    this.updatedBefore,
    this.withArchived = false,
    this.withDeleted,
    this.withExif,
  });

  String? city;

  String? country;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? createdAfter;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? createdBefore;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? deviceId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isArchived;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isEncoded;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isFavorite;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isMotion;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isNotInAlbum;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isOffline;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isVisible;

  String? lensModel;

  String? libraryId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? make;

  String? model;

  /// Minimum value: 1
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? page;

  List<String> personIds;

  String query;

  /// Minimum value: 1
  /// Maximum value: 1000
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? size;

  String? state;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? takenAfter;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? takenBefore;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? trashedAfter;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? trashedBefore;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AssetTypeEnum? type;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? updatedAfter;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? updatedBefore;

  bool withArchived;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? withDeleted;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? withExif;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SmartSearchDto &&
    other.city == city &&
    other.country == country &&
    other.createdAfter == createdAfter &&
    other.createdBefore == createdBefore &&
    other.deviceId == deviceId &&
    other.isArchived == isArchived &&
    other.isEncoded == isEncoded &&
    other.isFavorite == isFavorite &&
    other.isMotion == isMotion &&
    other.isNotInAlbum == isNotInAlbum &&
    other.isOffline == isOffline &&
    other.isVisible == isVisible &&
    other.lensModel == lensModel &&
    other.libraryId == libraryId &&
    other.make == make &&
    other.model == model &&
    other.page == page &&
    _deepEquality.equals(other.personIds, personIds) &&
    other.query == query &&
    other.size == size &&
    other.state == state &&
    other.takenAfter == takenAfter &&
    other.takenBefore == takenBefore &&
    other.trashedAfter == trashedAfter &&
    other.trashedBefore == trashedBefore &&
    other.type == type &&
    other.updatedAfter == updatedAfter &&
    other.updatedBefore == updatedBefore &&
    other.withArchived == withArchived &&
    other.withDeleted == withDeleted &&
    other.withExif == withExif;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (city == null ? 0 : city!.hashCode) +
    (country == null ? 0 : country!.hashCode) +
    (createdAfter == null ? 0 : createdAfter!.hashCode) +
    (createdBefore == null ? 0 : createdBefore!.hashCode) +
    (deviceId == null ? 0 : deviceId!.hashCode) +
    (isArchived == null ? 0 : isArchived!.hashCode) +
    (isEncoded == null ? 0 : isEncoded!.hashCode) +
    (isFavorite == null ? 0 : isFavorite!.hashCode) +
    (isMotion == null ? 0 : isMotion!.hashCode) +
    (isNotInAlbum == null ? 0 : isNotInAlbum!.hashCode) +
    (isOffline == null ? 0 : isOffline!.hashCode) +
    (isVisible == null ? 0 : isVisible!.hashCode) +
    (lensModel == null ? 0 : lensModel!.hashCode) +
    (libraryId == null ? 0 : libraryId!.hashCode) +
    (make == null ? 0 : make!.hashCode) +
    (model == null ? 0 : model!.hashCode) +
    (page == null ? 0 : page!.hashCode) +
    (personIds.hashCode) +
    (query.hashCode) +
    (size == null ? 0 : size!.hashCode) +
    (state == null ? 0 : state!.hashCode) +
    (takenAfter == null ? 0 : takenAfter!.hashCode) +
    (takenBefore == null ? 0 : takenBefore!.hashCode) +
    (trashedAfter == null ? 0 : trashedAfter!.hashCode) +
    (trashedBefore == null ? 0 : trashedBefore!.hashCode) +
    (type == null ? 0 : type!.hashCode) +
    (updatedAfter == null ? 0 : updatedAfter!.hashCode) +
    (updatedBefore == null ? 0 : updatedBefore!.hashCode) +
    (withArchived.hashCode) +
    (withDeleted == null ? 0 : withDeleted!.hashCode) +
    (withExif == null ? 0 : withExif!.hashCode);

  @override
  String toString() => 'SmartSearchDto[city=$city, country=$country, createdAfter=$createdAfter, createdBefore=$createdBefore, deviceId=$deviceId, isArchived=$isArchived, isEncoded=$isEncoded, isFavorite=$isFavorite, isMotion=$isMotion, isNotInAlbum=$isNotInAlbum, isOffline=$isOffline, isVisible=$isVisible, lensModel=$lensModel, libraryId=$libraryId, make=$make, model=$model, page=$page, personIds=$personIds, query=$query, size=$size, state=$state, takenAfter=$takenAfter, takenBefore=$takenBefore, trashedAfter=$trashedAfter, trashedBefore=$trashedBefore, type=$type, updatedAfter=$updatedAfter, updatedBefore=$updatedBefore, withArchived=$withArchived, withDeleted=$withDeleted, withExif=$withExif]';

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
    if (this.deviceId != null) {
      json[r'deviceId'] = this.deviceId;
    } else {
    //  json[r'deviceId'] = null;
    }
    if (this.isArchived != null) {
      json[r'isArchived'] = this.isArchived;
    } else {
    //  json[r'isArchived'] = null;
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
    if (this.isVisible != null) {
      json[r'isVisible'] = this.isVisible;
    } else {
    //  json[r'isVisible'] = null;
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
    if (this.page != null) {
      json[r'page'] = this.page;
    } else {
    //  json[r'page'] = null;
    }
      json[r'personIds'] = this.personIds;
      json[r'query'] = this.query;
    if (this.size != null) {
      json[r'size'] = this.size;
    } else {
    //  json[r'size'] = null;
    }
    if (this.state != null) {
      json[r'state'] = this.state;
    } else {
    //  json[r'state'] = null;
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
      json[r'withArchived'] = this.withArchived;
    if (this.withDeleted != null) {
      json[r'withDeleted'] = this.withDeleted;
    } else {
    //  json[r'withDeleted'] = null;
    }
    if (this.withExif != null) {
      json[r'withExif'] = this.withExif;
    } else {
    //  json[r'withExif'] = null;
    }
    return json;
  }

  /// Returns a new [SmartSearchDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SmartSearchDto? fromJson(dynamic value) {
    upgradeDto(value, "SmartSearchDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SmartSearchDto(
        city: mapValueOfType<String>(json, r'city'),
        country: mapValueOfType<String>(json, r'country'),
        createdAfter: mapDateTime(json, r'createdAfter', r''),
        createdBefore: mapDateTime(json, r'createdBefore', r''),
        deviceId: mapValueOfType<String>(json, r'deviceId'),
        isArchived: mapValueOfType<bool>(json, r'isArchived'),
        isEncoded: mapValueOfType<bool>(json, r'isEncoded'),
        isFavorite: mapValueOfType<bool>(json, r'isFavorite'),
        isMotion: mapValueOfType<bool>(json, r'isMotion'),
        isNotInAlbum: mapValueOfType<bool>(json, r'isNotInAlbum'),
        isOffline: mapValueOfType<bool>(json, r'isOffline'),
        isVisible: mapValueOfType<bool>(json, r'isVisible'),
        lensModel: mapValueOfType<String>(json, r'lensModel'),
        libraryId: mapValueOfType<String>(json, r'libraryId'),
        make: mapValueOfType<String>(json, r'make'),
        model: mapValueOfType<String>(json, r'model'),
        page: num.parse('${json[r'page']}'),
        personIds: json[r'personIds'] is Iterable
            ? (json[r'personIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        query: mapValueOfType<String>(json, r'query')!,
        size: num.parse('${json[r'size']}'),
        state: mapValueOfType<String>(json, r'state'),
        takenAfter: mapDateTime(json, r'takenAfter', r''),
        takenBefore: mapDateTime(json, r'takenBefore', r''),
        trashedAfter: mapDateTime(json, r'trashedAfter', r''),
        trashedBefore: mapDateTime(json, r'trashedBefore', r''),
        type: AssetTypeEnum.fromJson(json[r'type']),
        updatedAfter: mapDateTime(json, r'updatedAfter', r''),
        updatedBefore: mapDateTime(json, r'updatedBefore', r''),
        withArchived: mapValueOfType<bool>(json, r'withArchived') ?? false,
        withDeleted: mapValueOfType<bool>(json, r'withDeleted'),
        withExif: mapValueOfType<bool>(json, r'withExif'),
      );
    }
    return null;
  }

  static List<SmartSearchDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SmartSearchDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SmartSearchDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SmartSearchDto> mapFromJson(dynamic json) {
    final map = <String, SmartSearchDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SmartSearchDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SmartSearchDto-objects as value to a dart map
  static Map<String, List<SmartSearchDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SmartSearchDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SmartSearchDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'query',
  };
}

