//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class TagBulkAssetsDto {
  /// Returns a new [TagBulkAssetsDto] instance.
  TagBulkAssetsDto({
    this.assetIds = const [],
    this.tagIds = const [],
  });

  List<String> assetIds;

  List<String> tagIds;

  @override
  bool operator ==(Object other) => identical(this, other) || other is TagBulkAssetsDto &&
    _deepEquality.equals(other.assetIds, assetIds) &&
    _deepEquality.equals(other.tagIds, tagIds);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetIds.hashCode) +
    (tagIds.hashCode);

  @override
  String toString() => 'TagBulkAssetsDto[assetIds=$assetIds, tagIds=$tagIds]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetIds'] = this.assetIds;
      json[r'tagIds'] = this.tagIds;
    return json;
  }

  /// Returns a new [TagBulkAssetsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static TagBulkAssetsDto? fromJson(dynamic value) {
    upgradeDto(value, "TagBulkAssetsDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return TagBulkAssetsDto(
        assetIds: json[r'assetIds'] is Iterable
            ? (json[r'assetIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        tagIds: json[r'tagIds'] is Iterable
            ? (json[r'tagIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<TagBulkAssetsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TagBulkAssetsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TagBulkAssetsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, TagBulkAssetsDto> mapFromJson(dynamic json) {
    final map = <String, TagBulkAssetsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = TagBulkAssetsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of TagBulkAssetsDto-objects as value to a dart map
  static Map<String, List<TagBulkAssetsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<TagBulkAssetsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = TagBulkAssetsDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetIds',
    'tagIds',
  };
}

