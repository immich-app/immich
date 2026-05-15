//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetsForTagResponseDto {
  /// Returns a new [AssetsForTagResponseDto] instance.
  AssetsForTagResponseDto({
    this.assetIds = const [],
    required this.tagId,
  });

  /// Asset IDs associated with the tag
  List<String> assetIds;

  /// Tag ID
  String tagId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetsForTagResponseDto &&
    _deepEquality.equals(other.assetIds, assetIds) &&
    other.tagId == tagId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetIds.hashCode) +
    (tagId.hashCode);

  @override
  String toString() => 'AssetsForTagResponseDto[assetIds=$assetIds, tagId=$tagId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetIds'] = this.assetIds;
      json[r'tagId'] = this.tagId;
    return json;
  }

  /// Returns a new [AssetsForTagResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetsForTagResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetsForTagResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetsForTagResponseDto(
        assetIds: json[r'assetIds'] is Iterable
            ? (json[r'assetIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        tagId: mapValueOfType<String>(json, r'tagId')!,
      );
    }
    return null;
  }

  static List<AssetsForTagResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetsForTagResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetsForTagResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetsForTagResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetsForTagResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetsForTagResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetsForTagResponseDto-objects as value to a dart map
  static Map<String, List<AssetsForTagResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetsForTagResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetsForTagResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'tagId',
  };
}

