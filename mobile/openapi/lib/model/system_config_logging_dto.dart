//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigLoggingDto {
  /// Returns a new [SystemConfigLoggingDto] instance.
  SystemConfigLoggingDto({
    required this.enabled,
    required this.level,
  });

  bool enabled;

  LogLevel level;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigLoggingDto &&
    other.enabled == enabled &&
    other.level == level;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (enabled.hashCode) +
    (level.hashCode);

  @override
  String toString() => 'SystemConfigLoggingDto[enabled=$enabled, level=$level]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'enabled'] = this.enabled;
      json[r'level'] = this.level;
    return json;
  }

  /// Returns a new [SystemConfigLoggingDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigLoggingDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigLoggingDto(
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        level: LogLevel.fromJson(json[r'level'])!,
      );
    }
    return null;
  }

  static List<SystemConfigLoggingDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigLoggingDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigLoggingDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigLoggingDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigLoggingDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigLoggingDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigLoggingDto-objects as value to a dart map
  static Map<String, List<SystemConfigLoggingDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigLoggingDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigLoggingDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'enabled',
    'level',
  };
}

