//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigThemeThemesDto {
  /// Returns a new [SystemConfigThemeThemesDto] instance.
  SystemConfigThemeThemesDto({
    required this.dark,
    required this.light,
  });

  SystemConfigThemeCustomDto dark;

  SystemConfigThemeCustomDto light;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigThemeThemesDto &&
    other.dark == dark &&
    other.light == light;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (dark.hashCode) +
    (light.hashCode);

  @override
  String toString() => 'SystemConfigThemeThemesDto[dark=$dark, light=$light]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'dark'] = this.dark;
      json[r'light'] = this.light;
    return json;
  }

  /// Returns a new [SystemConfigThemeThemesDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigThemeThemesDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigThemeThemesDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigThemeThemesDto(
        dark: SystemConfigThemeCustomDto.fromJson(json[r'dark'])!,
        light: SystemConfigThemeCustomDto.fromJson(json[r'light'])!,
      );
    }
    return null;
  }

  static List<SystemConfigThemeThemesDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigThemeThemesDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigThemeThemesDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigThemeThemesDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigThemeThemesDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigThemeThemesDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigThemeThemesDto-objects as value to a dart map
  static Map<String, List<SystemConfigThemeThemesDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigThemeThemesDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigThemeThemesDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'dark',
    'light',
  };
}

