//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigCheckAvailableVersionDto {
  /// Returns a new [SystemConfigCheckAvailableVersionDto] instance.
  SystemConfigCheckAvailableVersionDto({
    required this.enabled,
  });

  bool enabled;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigCheckAvailableVersionDto &&
     other.enabled == enabled;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (enabled.hashCode);

  @override
  String toString() => 'SystemConfigCheckAvailableVersionDto[enabled=$enabled]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'enabled'] = this.enabled;
    return json;
  }

  /// Returns a new [SystemConfigCheckAvailableVersionDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigCheckAvailableVersionDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigCheckAvailableVersionDto(
        enabled: mapValueOfType<bool>(json, r'enabled')!,
      );
    }
    return null;
  }

  static List<SystemConfigCheckAvailableVersionDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigCheckAvailableVersionDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigCheckAvailableVersionDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigCheckAvailableVersionDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigCheckAvailableVersionDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigCheckAvailableVersionDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigCheckAvailableVersionDto-objects as value to a dart map
  static Map<String, List<SystemConfigCheckAvailableVersionDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigCheckAvailableVersionDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigCheckAvailableVersionDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'enabled',
  };
}

