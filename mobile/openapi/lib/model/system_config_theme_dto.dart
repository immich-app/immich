//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigThemeDto {
  /// Returns a new [SystemConfigThemeDto] instance.
  SystemConfigThemeDto({
    required this.customCss,
  });

  String customCss;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigThemeDto &&
    other.customCss == customCss;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (customCss.hashCode);

  @override
  String toString() => 'SystemConfigThemeDto[customCss=$customCss]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'customCss'] = this.customCss;
    return json;
  }

  /// Returns a new [SystemConfigThemeDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigThemeDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigThemeDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigThemeDto(
        customCss: mapValueOfType<String>(json, r'customCss')!,
      );
    }
    return null;
  }

  static List<SystemConfigThemeDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigThemeDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigThemeDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigThemeDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigThemeDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigThemeDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigThemeDto-objects as value to a dart map
  static Map<String, List<SystemConfigThemeDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigThemeDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigThemeDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'customCss',
  };
}

