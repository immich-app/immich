//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetBulkUpdateDto {
  /// Returns a new [AssetBulkUpdateDto] instance.
  AssetBulkUpdateDto({
    this.ids = const [],
    this.isArchived,
    this.isFavorite,
  });

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

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetBulkUpdateDto &&
     other.ids == ids &&
     other.isArchived == isArchived &&
     other.isFavorite == isFavorite;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (ids.hashCode) +
    (isArchived == null ? 0 : isArchived!.hashCode) +
    (isFavorite == null ? 0 : isFavorite!.hashCode);

  @override
  String toString() => 'AssetBulkUpdateDto[ids=$ids, isArchived=$isArchived, isFavorite=$isFavorite]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
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
    return json;
  }

  /// Returns a new [AssetBulkUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetBulkUpdateDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetBulkUpdateDto(
        ids: json[r'ids'] is List
            ? (json[r'ids'] as List).cast<String>()
            : const [],
        isArchived: mapValueOfType<bool>(json, r'isArchived'),
        isFavorite: mapValueOfType<bool>(json, r'isFavorite'),
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

