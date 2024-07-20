//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigLicenseDto {
  /// Returns a new [SystemConfigLicenseDto] instance.
  SystemConfigLicenseDto({
    required this.showLicensePanel,
  });

  bool showLicensePanel;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigLicenseDto &&
    other.showLicensePanel == showLicensePanel;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (showLicensePanel.hashCode);

  @override
  String toString() => 'SystemConfigLicenseDto[showLicensePanel=$showLicensePanel]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'showLicensePanel'] = this.showLicensePanel;
    return json;
  }

  /// Returns a new [SystemConfigLicenseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigLicenseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigLicenseDto(
        showLicensePanel: mapValueOfType<bool>(json, r'showLicensePanel')!,
      );
    }
    return null;
  }

  static List<SystemConfigLicenseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigLicenseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigLicenseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigLicenseDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigLicenseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigLicenseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigLicenseDto-objects as value to a dart map
  static Map<String, List<SystemConfigLicenseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigLicenseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigLicenseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'showLicensePanel',
  };
}

