//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetBulkUpdateDto {
  /// Returns a new [AssetBulkUpdateDto] instance.
  AssetBulkUpdateDto({
    this.dateTimeOriginal = const Optional.absent(),
    this.dateTimeRelative = const Optional.absent(),
    this.description = const Optional.absent(),
    this.duplicateId = const Optional.absent(),
    this.ids = const [],
    this.isFavorite = const Optional.absent(),
    this.latitude = const Optional.absent(),
    this.longitude = const Optional.absent(),
    this.rating = const Optional.absent(),
    this.timeZone = const Optional.absent(),
    this.visibility = const Optional.absent(),
  });

  /// Original date and time
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> dateTimeOriginal;

  /// Relative time offset in minutes
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<int?> dateTimeRelative;

  /// Asset description
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> description;

  /// Duplicate ID
  Optional<String?> duplicateId;

  /// Asset IDs to update
  List<String> ids;

  /// Mark as favorite
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<bool?> isFavorite;

  /// Latitude coordinate
  ///
  /// Minimum value: -90
  /// Maximum value: 90
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<num?> latitude;

  /// Longitude coordinate
  ///
  /// Minimum value: -180
  /// Maximum value: 180
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<num?> longitude;

  /// Rating in range [1-5] (starred), -1 (rejected), or null (unrated)
  ///
  /// Minimum value: -1
  /// Maximum value: 5
  Optional<int?> rating;

  /// Time zone (IANA timezone)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> timeZone;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<AssetVisibility?> visibility;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetBulkUpdateDto &&
    other.dateTimeOriginal == dateTimeOriginal &&
    other.dateTimeRelative == dateTimeRelative &&
    other.description == description &&
    other.duplicateId == duplicateId &&
    _deepEquality.equals(other.ids, ids) &&
    other.isFavorite == isFavorite &&
    other.latitude == latitude &&
    other.longitude == longitude &&
    other.rating == rating &&
    other.timeZone == timeZone &&
    other.visibility == visibility;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (dateTimeOriginal == null ? 0 : dateTimeOriginal!.hashCode) +
    (dateTimeRelative == null ? 0 : dateTimeRelative!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (duplicateId == null ? 0 : duplicateId!.hashCode) +
    (ids.hashCode) +
    (isFavorite == null ? 0 : isFavorite!.hashCode) +
    (latitude == null ? 0 : latitude!.hashCode) +
    (longitude == null ? 0 : longitude!.hashCode) +
    (rating == null ? 0 : rating!.hashCode) +
    (timeZone == null ? 0 : timeZone!.hashCode) +
    (visibility == null ? 0 : visibility!.hashCode);

  @override
  String toString() => 'AssetBulkUpdateDto[dateTimeOriginal=$dateTimeOriginal, dateTimeRelative=$dateTimeRelative, description=$description, duplicateId=$duplicateId, ids=$ids, isFavorite=$isFavorite, latitude=$latitude, longitude=$longitude, rating=$rating, timeZone=$timeZone, visibility=$visibility]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.dateTimeOriginal.isPresent) {
      final value = this.dateTimeOriginal.value;
      json[r'dateTimeOriginal'] = value;
    }
    if (this.dateTimeRelative.isPresent) {
      final value = this.dateTimeRelative.value;
      json[r'dateTimeRelative'] = value;
    }
    if (this.description.isPresent) {
      final value = this.description.value;
      json[r'description'] = value;
    }
    if (this.duplicateId.isPresent) {
      final value = this.duplicateId.value;
      json[r'duplicateId'] = value;
    }
      json[r'ids'] = this.ids;
    if (this.isFavorite.isPresent) {
      final value = this.isFavorite.value;
      json[r'isFavorite'] = value;
    }
    if (this.latitude.isPresent) {
      final value = this.latitude.value;
      json[r'latitude'] = value;
    }
    if (this.longitude.isPresent) {
      final value = this.longitude.value;
      json[r'longitude'] = value;
    }
    if (this.rating.isPresent) {
      final value = this.rating.value;
      json[r'rating'] = value;
    }
    if (this.timeZone.isPresent) {
      final value = this.timeZone.value;
      json[r'timeZone'] = value;
    }
    if (this.visibility.isPresent) {
      final value = this.visibility.value;
      json[r'visibility'] = value;
    }
    return json;
  }

  /// Returns a new [AssetBulkUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetBulkUpdateDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetBulkUpdateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetBulkUpdateDto(
        dateTimeOriginal: json.containsKey(r'dateTimeOriginal') ? Optional.present(mapValueOfType<String>(json, r'dateTimeOriginal')) : const Optional.absent(),
        dateTimeRelative: json.containsKey(r'dateTimeRelative') ? Optional.present(json[r'dateTimeRelative'] == null ? null : int.parse('${json[r'dateTimeRelative']}')) : const Optional.absent(),
        description: json.containsKey(r'description') ? Optional.present(mapValueOfType<String>(json, r'description')) : const Optional.absent(),
        duplicateId: json.containsKey(r'duplicateId') ? Optional.present(mapValueOfType<String>(json, r'duplicateId')) : const Optional.absent(),
        ids: json[r'ids'] is Iterable
            ? (json[r'ids'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        isFavorite: json.containsKey(r'isFavorite') ? Optional.present(mapValueOfType<bool>(json, r'isFavorite')) : const Optional.absent(),
        latitude: json.containsKey(r'latitude') ? Optional.present(json[r'latitude'] == null ? null : num.parse('${json[r'latitude']}')) : const Optional.absent(),
        longitude: json.containsKey(r'longitude') ? Optional.present(json[r'longitude'] == null ? null : num.parse('${json[r'longitude']}')) : const Optional.absent(),
        rating: json.containsKey(r'rating') ? Optional.present(json[r'rating'] == null ? null : int.parse('${json[r'rating']}')) : const Optional.absent(),
        timeZone: json.containsKey(r'timeZone') ? Optional.present(mapValueOfType<String>(json, r'timeZone')) : const Optional.absent(),
        visibility: json.containsKey(r'visibility') ? Optional.present(AssetVisibility.fromJson(json[r'visibility'])) : const Optional.absent(),
      );
    }
    return null;
  }

  static List<AssetBulkUpdateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetBulkUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetBulkUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetBulkUpdateDto> mapFromJson(dynamic json) {
    final map = <String, AssetBulkUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetBulkUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetBulkUpdateDto-objects as value to a dart map
  static Map<String, List<AssetBulkUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetBulkUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetBulkUpdateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'ids',
  };
}

