//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SmartSearchFacetsDto {
  /// Returns a new [SmartSearchFacetsDto] instance.
  SmartSearchFacetsDto({
    this.city,
    this.country,
    this.isFavorite,
    this.isNotInAlbum,
    this.language,
    this.make,
    this.model,
    this.personIds = const [],
    this.query,
    this.queryAssetId,
    this.rating,
    this.spaceId,
    this.spacePersonIds = const [],
    this.tagIds = const [],
    this.takenAfter,
    this.takenBefore,
    this.type,
    this.withSharedSpaces,
  });

  /// Filter by city name
  String? city;

  /// Filter by country name
  String? country;

  /// Filter by favorite status
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isFavorite;

  /// Filter assets not in any album
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isNotInAlbum;

  /// Search language code
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? language;

  /// Filter by camera make
  String? make;

  /// Filter by camera model
  String? model;

  /// Filter by person IDs
  List<String> personIds;

  /// Natural language search query
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? query;

  /// Asset ID to use as search reference
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? queryAssetId;

  /// Filter by rating [1-5], or null for unrated
  ///
  /// Minimum value: -1
  /// Maximum value: 5
  num? rating;

  /// Shared space ID to filter by
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? spaceId;

  /// Shared space person IDs to filter by
  List<String> spacePersonIds;

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

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AssetTypeEnum? type;

  /// Include shared spaces the user is a member of
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? withSharedSpaces;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SmartSearchFacetsDto &&
    other.city == city &&
    other.country == country &&
    other.isFavorite == isFavorite &&
    other.isNotInAlbum == isNotInAlbum &&
    other.language == language &&
    other.make == make &&
    other.model == model &&
    _deepEquality.equals(other.personIds, personIds) &&
    other.query == query &&
    other.queryAssetId == queryAssetId &&
    other.rating == rating &&
    other.spaceId == spaceId &&
    _deepEquality.equals(other.spacePersonIds, spacePersonIds) &&
    _deepEquality.equals(other.tagIds, tagIds) &&
    other.takenAfter == takenAfter &&
    other.takenBefore == takenBefore &&
    other.type == type &&
    other.withSharedSpaces == withSharedSpaces;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (city == null ? 0 : city!.hashCode) +
    (country == null ? 0 : country!.hashCode) +
    (isFavorite == null ? 0 : isFavorite!.hashCode) +
    (isNotInAlbum == null ? 0 : isNotInAlbum!.hashCode) +
    (language == null ? 0 : language!.hashCode) +
    (make == null ? 0 : make!.hashCode) +
    (model == null ? 0 : model!.hashCode) +
    (personIds.hashCode) +
    (query == null ? 0 : query!.hashCode) +
    (queryAssetId == null ? 0 : queryAssetId!.hashCode) +
    (rating == null ? 0 : rating!.hashCode) +
    (spaceId == null ? 0 : spaceId!.hashCode) +
    (spacePersonIds.hashCode) +
    (tagIds == null ? 0 : tagIds!.hashCode) +
    (takenAfter == null ? 0 : takenAfter!.hashCode) +
    (takenBefore == null ? 0 : takenBefore!.hashCode) +
    (type == null ? 0 : type!.hashCode) +
    (withSharedSpaces == null ? 0 : withSharedSpaces!.hashCode);

  @override
  String toString() => 'SmartSearchFacetsDto[city=$city, country=$country, isFavorite=$isFavorite, isNotInAlbum=$isNotInAlbum, language=$language, make=$make, model=$model, personIds=$personIds, query=$query, queryAssetId=$queryAssetId, rating=$rating, spaceId=$spaceId, spacePersonIds=$spacePersonIds, tagIds=$tagIds, takenAfter=$takenAfter, takenBefore=$takenBefore, type=$type, withSharedSpaces=$withSharedSpaces]';

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
    if (this.isFavorite != null) {
      json[r'isFavorite'] = this.isFavorite;
    } else {
    //  json[r'isFavorite'] = null;
    }
    if (this.isNotInAlbum != null) {
      json[r'isNotInAlbum'] = this.isNotInAlbum;
    } else {
    //  json[r'isNotInAlbum'] = null;
    }
    if (this.language != null) {
      json[r'language'] = this.language;
    } else {
    //  json[r'language'] = null;
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
      json[r'personIds'] = this.personIds;
    if (this.query != null) {
      json[r'query'] = this.query;
    } else {
    //  json[r'query'] = null;
    }
    if (this.queryAssetId != null) {
      json[r'queryAssetId'] = this.queryAssetId;
    } else {
    //  json[r'queryAssetId'] = null;
    }
    if (this.rating != null) {
      json[r'rating'] = this.rating;
    } else {
    //  json[r'rating'] = null;
    }
    if (this.spaceId != null) {
      json[r'spaceId'] = this.spaceId;
    } else {
    //  json[r'spaceId'] = null;
    }
      json[r'spacePersonIds'] = this.spacePersonIds;
    if (this.tagIds != null) {
      json[r'tagIds'] = this.tagIds;
    } else {
    //  json[r'tagIds'] = null;
    }
    if (this.takenAfter != null) {
      json[r'takenAfter'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.takenAfter!.millisecondsSinceEpoch
        : this.takenAfter!.toUtc().toIso8601String();
    } else {
    //  json[r'takenAfter'] = null;
    }
    if (this.takenBefore != null) {
      json[r'takenBefore'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.takenBefore!.millisecondsSinceEpoch
        : this.takenBefore!.toUtc().toIso8601String();
    } else {
    //  json[r'takenBefore'] = null;
    }
    if (this.type != null) {
      json[r'type'] = this.type;
    } else {
    //  json[r'type'] = null;
    }
    if (this.withSharedSpaces != null) {
      json[r'withSharedSpaces'] = this.withSharedSpaces;
    } else {
    //  json[r'withSharedSpaces'] = null;
    }
    return json;
  }

  /// Returns a new [SmartSearchFacetsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SmartSearchFacetsDto? fromJson(dynamic value) {
    upgradeDto(value, "SmartSearchFacetsDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SmartSearchFacetsDto(
        city: mapValueOfType<String>(json, r'city'),
        country: mapValueOfType<String>(json, r'country'),
        isFavorite: mapValueOfType<bool>(json, r'isFavorite'),
        isNotInAlbum: mapValueOfType<bool>(json, r'isNotInAlbum'),
        language: mapValueOfType<String>(json, r'language'),
        make: mapValueOfType<String>(json, r'make'),
        model: mapValueOfType<String>(json, r'model'),
        personIds: json[r'personIds'] is Iterable
            ? (json[r'personIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        query: mapValueOfType<String>(json, r'query'),
        queryAssetId: mapValueOfType<String>(json, r'queryAssetId'),
        rating: json[r'rating'] == null
            ? null
            : num.parse('${json[r'rating']}'),
        spaceId: mapValueOfType<String>(json, r'spaceId'),
        spacePersonIds: json[r'spacePersonIds'] is Iterable
            ? (json[r'spacePersonIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        tagIds: json[r'tagIds'] is Iterable
            ? (json[r'tagIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        takenAfter: mapDateTime(json, r'takenAfter', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/'),
        takenBefore: mapDateTime(json, r'takenBefore', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/'),
        type: AssetTypeEnum.fromJson(json[r'type']),
        withSharedSpaces: mapValueOfType<bool>(json, r'withSharedSpaces'),
      );
    }
    return null;
  }

  static List<SmartSearchFacetsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SmartSearchFacetsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SmartSearchFacetsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SmartSearchFacetsDto> mapFromJson(dynamic json) {
    final map = <String, SmartSearchFacetsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SmartSearchFacetsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SmartSearchFacetsDto-objects as value to a dart map
  static Map<String, List<SmartSearchFacetsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SmartSearchFacetsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SmartSearchFacetsDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

