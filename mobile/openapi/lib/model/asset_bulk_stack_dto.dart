//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetBulkStackDto {
  /// Returns a new [AssetBulkStackDto] instance.
  AssetBulkStackDto({
    this.stacks = const [],
  });

  List<AssetStackDto> stacks;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetBulkStackDto &&
    _deepEquality.equals(other.stacks, stacks);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (stacks.hashCode);

  @override
  String toString() => 'AssetBulkStackDto[stacks=$stacks]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'stacks'] = this.stacks;
    return json;
  }

  /// Returns a new [AssetBulkStackDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetBulkStackDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetBulkStackDto(
        stacks: AssetStackDto.listFromJson(json[r'stacks']),
      );
    }
    return null;
  }

  static List<AssetBulkStackDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetBulkStackDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetBulkStackDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetBulkStackDto> mapFromJson(dynamic json) {
    final map = <String, AssetBulkStackDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetBulkStackDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetBulkStackDto-objects as value to a dart map
  static Map<String, List<AssetBulkStackDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetBulkStackDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetBulkStackDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'stacks',
  };
}

