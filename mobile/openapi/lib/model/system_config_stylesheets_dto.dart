//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigStylesheetsDto {
  /// Returns a new [SystemConfigStylesheetsDto] instance.
  SystemConfigStylesheetsDto({
    required this.css,
  });

  String css;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigStylesheetsDto &&
     other.css == css;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (css.hashCode);

  @override
  String toString() => 'SystemConfigStylesheetsDto[css=$css]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'css'] = this.css;
    return json;
  }

  /// Returns a new [SystemConfigStylesheetsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigStylesheetsDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigStylesheetsDto(
        css: mapValueOfType<String>(json, r'css')!,
      );
    }
    return null;
  }

  static List<SystemConfigStylesheetsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigStylesheetsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigStylesheetsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigStylesheetsDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigStylesheetsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigStylesheetsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigStylesheetsDto-objects as value to a dart map
  static Map<String, List<SystemConfigStylesheetsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigStylesheetsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigStylesheetsDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'css',
  };
}

