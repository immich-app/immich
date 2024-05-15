//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigLibraryScanDto {
  /// Returns a new [SystemConfigLibraryScanDto] instance.
  SystemConfigLibraryScanDto({
    required this.cronExpression,
    required this.enabled,
  });

  String cronExpression;

  bool enabled;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigLibraryScanDto &&
    other.cronExpression == cronExpression &&
    other.enabled == enabled;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (cronExpression.hashCode) +
    (enabled.hashCode);

  @override
  String toString() => 'SystemConfigLibraryScanDto[cronExpression=$cronExpression, enabled=$enabled]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'cronExpression'] = this.cronExpression;
      json[r'enabled'] = this.enabled;
    return json;
  }

  /// Returns a new [SystemConfigLibraryScanDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigLibraryScanDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigLibraryScanDto(
        cronExpression: mapValueOfType<String>(json, r'cronExpression')!,
        enabled: mapValueOfType<bool>(json, r'enabled')!,
      );
    }
    return null;
  }

  static List<SystemConfigLibraryScanDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigLibraryScanDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigLibraryScanDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigLibraryScanDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigLibraryScanDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigLibraryScanDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigLibraryScanDto-objects as value to a dart map
  static Map<String, List<SystemConfigLibraryScanDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigLibraryScanDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigLibraryScanDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'cronExpression',
    'enabled',
  };
}

