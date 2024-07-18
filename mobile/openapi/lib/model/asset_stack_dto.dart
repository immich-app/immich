//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetStackDto {
  /// Returns a new [AssetStackDto] instance.
  AssetStackDto({
    this.ids = const [],
    required this.stackParentId,
  });

  List<String> ids;

  String stackParentId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetStackDto &&
    _deepEquality.equals(other.ids, ids) &&
    other.stackParentId == stackParentId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (ids.hashCode) +
    (stackParentId.hashCode);

  @override
  String toString() => 'AssetStackDto[ids=$ids, stackParentId=$stackParentId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'ids'] = this.ids;
      json[r'stackParentId'] = this.stackParentId;
    return json;
  }

  /// Returns a new [AssetStackDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetStackDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetStackDto(
        ids: json[r'ids'] is Iterable
            ? (json[r'ids'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        stackParentId: mapValueOfType<String>(json, r'stackParentId')!,
      );
    }
    return null;
  }

  static List<AssetStackDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetStackDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetStackDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetStackDto> mapFromJson(dynamic json) {
    final map = <String, AssetStackDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetStackDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetStackDto-objects as value to a dart map
  static Map<String, List<AssetStackDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetStackDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetStackDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'ids',
    'stackParentId',
  };
}

