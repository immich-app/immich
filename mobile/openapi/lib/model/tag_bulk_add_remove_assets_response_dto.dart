//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class TagBulkAddRemoveAssetsResponseDto {
  /// Returns a new [TagBulkAddRemoveAssetsResponseDto] instance.
  TagBulkAddRemoveAssetsResponseDto({
    required this.addedCount,
    required this.removedCount,
  });

  /// Number of assets tagged
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int addedCount;

  /// Number of assets untagged
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int removedCount;

  @override
  bool operator ==(Object other) => identical(this, other) || other is TagBulkAddRemoveAssetsResponseDto &&
    other.addedCount == addedCount &&
    other.removedCount == removedCount;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (addedCount.hashCode) +
    (removedCount.hashCode);

  @override
  String toString() => 'TagBulkAddRemoveAssetsResponseDto[addedCount=$addedCount, removedCount=$removedCount]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'addedCount'] = this.addedCount;
      json[r'removedCount'] = this.removedCount;
    return json;
  }

  /// Returns a new [TagBulkAddRemoveAssetsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static TagBulkAddRemoveAssetsResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "TagBulkAddRemoveAssetsResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return TagBulkAddRemoveAssetsResponseDto(
        addedCount: mapValueOfType<int>(json, r'addedCount')!,
        removedCount: mapValueOfType<int>(json, r'removedCount')!,
      );
    }
    return null;
  }

  static List<TagBulkAddRemoveAssetsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TagBulkAddRemoveAssetsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TagBulkAddRemoveAssetsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, TagBulkAddRemoveAssetsResponseDto> mapFromJson(dynamic json) {
    final map = <String, TagBulkAddRemoveAssetsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = TagBulkAddRemoveAssetsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of TagBulkAddRemoveAssetsResponseDto-objects as value to a dart map
  static Map<String, List<TagBulkAddRemoveAssetsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<TagBulkAddRemoveAssetsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = TagBulkAddRemoveAssetsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'addedCount',
    'removedCount',
  };
}

