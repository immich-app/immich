//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class TagsForAssetsResponseDto {
  /// Returns a new [TagsForAssetsResponseDto] instance.
  TagsForAssetsResponseDto({
    this.assetIds = const Optional.present(const []),
    required this.tagId,
  });

  /// Asset IDs associated with the tag
  Optional<List<String>?> assetIds;

  /// Tag ID
  String tagId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is TagsForAssetsResponseDto &&
    _deepEquality.equals(other.assetIds, assetIds) &&
    other.tagId == tagId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetIds.hashCode) +
    (tagId.hashCode);

  @override
  String toString() => 'TagsForAssetsResponseDto[assetIds=$assetIds, tagId=$tagId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.assetIds.isPresent) {
      final value = this.assetIds.value;
      json[r'assetIds'] = value;
    }
      json[r'tagId'] = this.tagId;
    return json;
  }

  /// Returns a new [TagsForAssetsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static TagsForAssetsResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "TagsForAssetsResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return TagsForAssetsResponseDto(
        assetIds: json.containsKey(r'assetIds') ? Optional.present(json[r'assetIds'] is Iterable
            ? (json[r'assetIds'] as Iterable).cast<String>().toList(growable: false)
            : const []) : const Optional.absent(),
        tagId: mapValueOfType<String>(json, r'tagId')!,
      );
    }
    return null;
  }

  static List<TagsForAssetsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TagsForAssetsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TagsForAssetsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, TagsForAssetsResponseDto> mapFromJson(dynamic json) {
    final map = <String, TagsForAssetsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = TagsForAssetsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of TagsForAssetsResponseDto-objects as value to a dart map
  static Map<String, List<TagsForAssetsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<TagsForAssetsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = TagsForAssetsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'tagId',
  };
}

