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
    this.dateTimeOriginal,
    this.duplicateId,
    this.ids = const [],
    this.isArchived,
    this.isFavorite,
    this.latitude,
    this.longitude,
    this.rating,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? dateTimeOriginal;

  String? duplicateId;

  List<String> ids;

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
  bool? isFavorite;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? latitude;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? longitude;

  /// Minimum value: 0
  /// Maximum value: 5
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? rating;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetBulkUpdateDto &&
    other.dateTimeOriginal == dateTimeOriginal &&
    other.duplicateId == duplicateId &&
    _deepEquality.equals(other.ids, ids) &&
    other.isArchived == isArchived &&
    other.isFavorite == isFavorite &&
    other.latitude == latitude &&
    other.longitude == longitude &&
    other.rating == rating;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (dateTimeOriginal == null ? 0 : dateTimeOriginal!.hashCode) +
    (duplicateId == null ? 0 : duplicateId!.hashCode) +
    (ids.hashCode) +
    (isArchived == null ? 0 : isArchived!.hashCode) +
    (isFavorite == null ? 0 : isFavorite!.hashCode) +
    (latitude == null ? 0 : latitude!.hashCode) +
    (longitude == null ? 0 : longitude!.hashCode) +
    (rating == null ? 0 : rating!.hashCode);

  @override
  String toString() => 'AssetBulkUpdateDto[dateTimeOriginal=$dateTimeOriginal, duplicateId=$duplicateId, ids=$ids, isArchived=$isArchived, isFavorite=$isFavorite, latitude=$latitude, longitude=$longitude, rating=$rating]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.dateTimeOriginal != null) {
      json[r'dateTimeOriginal'] = this.dateTimeOriginal;
    } else {
    //  json[r'dateTimeOriginal'] = null;
    }
    if (this.duplicateId != null) {
      json[r'duplicateId'] = this.duplicateId;
    } else {
    //  json[r'duplicateId'] = null;
    }
      json[r'ids'] = this.ids;
    if (this.isArchived != null) {
      json[r'isArchived'] = this.isArchived;
    } else {
    //  json[r'isArchived'] = null;
    }
    if (this.isFavorite != null) {
      json[r'isFavorite'] = this.isFavorite;
    } else {
    //  json[r'isFavorite'] = null;
    }
    if (this.latitude != null) {
      json[r'latitude'] = this.latitude;
    } else {
    //  json[r'latitude'] = null;
    }
    if (this.longitude != null) {
      json[r'longitude'] = this.longitude;
    } else {
    //  json[r'longitude'] = null;
    }
    if (this.rating != null) {
      json[r'rating'] = this.rating;
    } else {
    //  json[r'rating'] = null;
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
        dateTimeOriginal: mapValueOfType<String>(json, r'dateTimeOriginal'),
        duplicateId: mapValueOfType<String>(json, r'duplicateId'),
        ids: json[r'ids'] is Iterable
            ? (json[r'ids'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        isArchived: mapValueOfType<bool>(json, r'isArchived'),
        isFavorite: mapValueOfType<bool>(json, r'isFavorite'),
        latitude: num.parse('${json[r'latitude']}'),
        longitude: num.parse('${json[r'longitude']}'),
        rating: num.parse('${json[r'rating']}'),
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

