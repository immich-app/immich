//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetMetadataResponseDto {
  /// Returns a new [AssetMetadataResponseDto] instance.
  AssetMetadataResponseDto({
    required this.key,
    required this.updatedAt,
    required this.value,
  });

  String key;

  DateTime updatedAt;

  Object value;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetMetadataResponseDto &&
    other.key == key &&
    other.updatedAt == updatedAt &&
    other.value == value;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (key.hashCode) +
    (updatedAt.hashCode) +
    (value.hashCode);

  @override
  String toString() => 'AssetMetadataResponseDto[key=$key, updatedAt=$updatedAt, value=$value]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'key'] = this.key;
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
      json[r'value'] = this.value;
    return json;
  }

  /// Returns a new [AssetMetadataResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetMetadataResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetMetadataResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetMetadataResponseDto(
        key: mapValueOfType<String>(json, r'key')!,
        updatedAt: mapDateTime(json, r'updatedAt', r'')!,
        value: mapValueOfType<Object>(json, r'value')!,
      );
    }
    return null;
  }

  static List<AssetMetadataResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetMetadataResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetMetadataResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetMetadataResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetMetadataResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetMetadataResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetMetadataResponseDto-objects as value to a dart map
  static Map<String, List<AssetMetadataResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetMetadataResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetMetadataResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'key',
    'updatedAt',
    'value',
  };
}

