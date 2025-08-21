//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetFaceDeleteDto {
  /// Returns a new [AssetFaceDeleteDto] instance.
  AssetFaceDeleteDto({
    required this.force,
  });

  bool force;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetFaceDeleteDto &&
    other.force == force;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (force.hashCode);

  @override
  String toString() => 'AssetFaceDeleteDto[force=$force]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'force'] = this.force;
    return json;
  }

  /// Returns a new [AssetFaceDeleteDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetFaceDeleteDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetFaceDeleteDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetFaceDeleteDto(
        force: mapValueOfType<bool>(json, r'force')!,
      );
    }
    return null;
  }

  static List<AssetFaceDeleteDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetFaceDeleteDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetFaceDeleteDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetFaceDeleteDto> mapFromJson(dynamic json) {
    final map = <String, AssetFaceDeleteDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetFaceDeleteDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetFaceDeleteDto-objects as value to a dart map
  static Map<String, List<AssetFaceDeleteDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetFaceDeleteDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetFaceDeleteDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'force',
  };
}

