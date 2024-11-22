//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigThemeCustomDto {
  /// Returns a new [SystemConfigThemeCustomDto] instance.
  SystemConfigThemeCustomDto({
    required this.bg,
    required this.error,
    required this.fg,
    required this.gray,
    required this.primary,
    required this.success,
    required this.warning,
  });

  String bg;

  String error;

  String fg;

  String gray;

  String primary;

  String success;

  String warning;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigThemeCustomDto &&
    other.bg == bg &&
    other.error == error &&
    other.fg == fg &&
    other.gray == gray &&
    other.primary == primary &&
    other.success == success &&
    other.warning == warning;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (bg.hashCode) +
    (error.hashCode) +
    (fg.hashCode) +
    (gray.hashCode) +
    (primary.hashCode) +
    (success.hashCode) +
    (warning.hashCode);

  @override
  String toString() => 'SystemConfigThemeCustomDto[bg=$bg, error=$error, fg=$fg, gray=$gray, primary=$primary, success=$success, warning=$warning]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'bg'] = this.bg;
      json[r'error'] = this.error;
      json[r'fg'] = this.fg;
      json[r'gray'] = this.gray;
      json[r'primary'] = this.primary;
      json[r'success'] = this.success;
      json[r'warning'] = this.warning;
    return json;
  }

  /// Returns a new [SystemConfigThemeCustomDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigThemeCustomDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigThemeCustomDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigThemeCustomDto(
        bg: mapValueOfType<String>(json, r'bg')!,
        error: mapValueOfType<String>(json, r'error')!,
        fg: mapValueOfType<String>(json, r'fg')!,
        gray: mapValueOfType<String>(json, r'gray')!,
        primary: mapValueOfType<String>(json, r'primary')!,
        success: mapValueOfType<String>(json, r'success')!,
        warning: mapValueOfType<String>(json, r'warning')!,
      );
    }
    return null;
  }

  static List<SystemConfigThemeCustomDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigThemeCustomDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigThemeCustomDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigThemeCustomDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigThemeCustomDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigThemeCustomDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigThemeCustomDto-objects as value to a dart map
  static Map<String, List<SystemConfigThemeCustomDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigThemeCustomDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigThemeCustomDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'bg',
    'error',
    'fg',
    'gray',
    'primary',
    'success',
    'warning',
  };
}

